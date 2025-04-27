import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import { Box, Button, IconButton, TextField, Tooltip } from "@mui/material";
import { styled } from "styled-components";
import { useMutation, useQuery } from "@apollo/client";
import { ADD_ITEM_MUTATION, COMPLETE_ITEM_MUTATION, DELETE_ITEM_MUTATION, GET_TODO_LIST, UPDATE_ITEM_MUTATION } from "./queries";
import { Check, Delete, Edit, EditOff, FilterAltOff } from "@mui/icons-material";
import { useEffect, useRef, useState } from "react";
import { getOperationName } from "@apollo/client/utilities";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

const ContainerTop = styled.form`
  display: flex;
  background-color: #dcdcdc;
  flex-direction: column;
  justify-content: center;
  padding: 10px;
  gap: 10px;
  border-radius: 5px;
`;

const ContainerList = styled.div`
  display: flex;
  width: 600px;
  background-color: #dcdcdc;
  flex-direction: column;
  justify-content: center;
  padding: 10px;
  gap: 10px;
  border-radius: 5px;
`;
const ContainerListItem = styled.div`
  background-color: #efefef;
  padding: 10px;
  border-radius: 5px;
  max-height: 400px;
  overflow: auto;
`;

const ContainerButton = styled.div`
  display: flex;
  justify-content: space-around;
  gap: 10px;
`;

const Title = styled.div`
  font-weight: bold;
  font-size: 28px;
`;

const INITIAL_UPDATING_STATE = {
  active: false,
  id: null,
  name: null
}

export default function CheckboxList() {
  const [item, setItem] = useState('');
  const [error, setError] = useState('');
  const [filter, setFilter] = useState({});
  const [updating, setUpdating] = useState(INITIAL_UPDATING_STATE);

  const { data, error: getTodoListError } = useQuery(GET_TODO_LIST, {
    variables: { filter },
  });

  const [addItem] = useMutation(ADD_ITEM_MUTATION);
  const [updateItem] = useMutation(UPDATE_ITEM_MUTATION);
  const [deleteItem] = useMutation(DELETE_ITEM_MUTATION);
  const [completeItem] = useMutation(COMPLETE_ITEM_MUTATION);

  /**
   * Métodos responsáveis por criar as referências dos campos
   * de edição do item, permitindo o focus automático no 
   * input ao clicar em "editar"
   */
  const textFieldRefs = useRef([]);
  const addTextFieldRef = (el, id) => {
    textFieldRefs.current[id] = el;
  };

  /**
   * Método responsável por inserir o item na listagem
   * com tratamento de erros que podem vir da API
   * @param {*} event 
   */
  const onSubmit = async (event) => {
    event.preventDefault();
    try {
      await addItem({
        variables: {
          values: {
            name: item,
          },
        },
        awaitRefetchQueries: true,
        refetchQueries: [getOperationName(GET_TODO_LIST)],
      });
      setItem("");
      setFilter({});
      setError('');
    } catch (error) {
      setError(error.message);
    }
  };

  /**
   * Método que executa a requisição de exclusão de item
   * recebendo um item como parâmetro e enviando o id
   * para o backend
   * 
   * Após execução com sucesso da query, é realizado um
   * novo fetch dos dados para manter a lista atualizada
   * @param {object} item  
   */
  const onDelete = async ({ id }) => {
    await deleteItem({
      variables: { id },
      awaitRefetchQueries: true,
      refetchQueries: [getOperationName(GET_TODO_LIST)],
    });
  };

  /**
   * Método que executa a requisição de toggle de status
   * recebendo um item como parâmetro e enviando o id
   * para o backend
   * 
   * Após execução com sucesso da query, é realizado um
   * novo fetch dos dados para manter a lista atualizada
   * @param {object} item 
   */
  const onComplete = async ({ id }) => {
    await completeItem({
      variables: { id },
      awaitRefetchQueries: true,
      refetchQueries: [getOperationName(GET_TODO_LIST)],
    });
  };

  /**
   * Método responsável por iniciar um fluxo de edição.
   * Recebe um item por parâmetro, atualiza o estado
   * que controla a edição e executa um focus no input
   * de texto do item a ser editado, reduzindo cliques
   * para o usuário
   * @param {object} item 
   */
  const startUpdate = async ({ id, name }) => {
    setUpdating({ active: true, id, name });
    setTimeout(() => {
      if (textFieldRefs.current[id]) {
        textFieldRefs.current[id].focus();
      }
    }, 50);
  }

  /**
   * Método que executa a requisição de atualização de item
   * enviando os dados que estão no estado da edição para o
   * backend. Foi adicionado um tratamento de erro para 
   * possíveis retornos da API
   * 
   * Após execução com sucesso da query, é realizado um
   * novo fetch dos dados para manter a lista atualizada
   * e o estado de edição é resetado
   */
  const onUpdate = async () => {
    try {
      await updateItem({
        variables: {
          values: {
            id: updating.id,
            name: updating.name
          }
        },
        awaitRefetchQueries: true,
        refetchQueries: [getOperationName(GET_TODO_LIST)],
      })
  
      setUpdating(INITIAL_UPDATING_STATE);
    } catch (error) {
      setUpdating((prev) => ({ ...prev, error: error.message }));
    }
  };

  /**
   * Método que executa tanto a ação de filtrar
   * quanto a ação de limpar o filtro, de acordo
   * com o que recebe por parâmetro
   * @param {string} type 
   */
  const onFilter = async (type = 'filter') => {
    if (type === 'clear') {
      setFilter({});
      setItem('');
    } else {
      if (item && item.trim().length) {
        setFilter({ name: item });
      }
    }
  };

  /**
   * O objetivo desse useEffect é assistir aos
   * erros que podem vir da request de listagem
   * dos itens
   */
  useEffect(() => {
    if (getTodoListError?.message) {
      setError(getTodoListError.message);
    }
  }, [getTodoListError]);

  return (
    <Container>
      <ContainerList>
        <Title>TODO LIST</Title>
        <ContainerTop onSubmit={onSubmit}>
          <TextField
            id="item"
            label="Digite aqui"
            value={item}
            type="text"
            variant="standard"
            onChange={(e) => {
              setError('')
              setItem(e?.target?.value)
            }}
            error={!!error}
            helperText={error}
          />
          <ContainerButton>
            <Box display="flex" gap={1} sx={{ width: "100%" }}>
              <Button
                variant="contained"
                sx={{ width: "100%" }}
                color="info"
                onClick={onFilter}
              >
                Filtrar
              </Button>
              {filter?.name && (
                <Button
                  variant="outlined"
                  sx={{ width: "100%", display: 'flex', gap: 1 }}
                  color="info"
                  onClick={() => onFilter('clear')}
                >
                  Limpar
                  <FilterAltOff />
                </Button>
              )}
            </Box>
            <Button
              variant="contained"
              sx={{ width: "100%" }}
              color="success"
              type="submit"
            >
              Salvar
            </Button>
          </ContainerButton>
        </ContainerTop>
        {!!data?.todoList?.length && (
          <List sx={{ padding: '10px' }}>
            <ContainerListItem>
              {data?.todoList?.map((value) => {
                return (
                  <ListItem
                    key={value.id}
                    disablePadding
                    sx={{
                      borderRadius: "5px",
                      marginTop: "5px",
                      marginBottom: "5px",
                    }}
                  >
                    <ListItemButton onClick={() => onComplete(value)} dense>
                      {updating.active && updating.id === value.id ? (
                        <TextField
                          inputRef={(el) => addTextFieldRef(el, value.id)}
                          value={updating.name}
                          onChange={(e) => setUpdating((prev) => ({ ...prev, name: e.target.value, error: '' }))}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") onUpdate()
                          }}
                          variant="standard"
                          size="small"
                          fullWidth
                          error={!!updating.error}
                          helperText={updating.error}
                        />
                      ) : (
                        <ListItemText
                          id={value.id}
                          primary={value?.name}
                          sx={{
                            textDecoration: value.completed ? 'line-through' : 'none',
                            color: value.completed ? 'gray' : 'inherit',
                          }}
                        />
                      )}
                      {updating.active && updating.id === value.id ? (
                        <Box display="flex">
                          <Tooltip title="Concluir">
                            <IconButton
                              size="small" 
                              variant="text" 
                              onClick={(event) => {
                                event.stopPropagation();
                                onUpdate();
                              }}
                            >
                              <Check color="success"  />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Cancelar">
                            <IconButton
                              size="small" 
                              variant="text" 
                              onClick={(event) => {
                                event.stopPropagation();
                                setUpdating(INITIAL_UPDATING_STATE);
                              }}
                            >
                              <EditOff color="secondary"  />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      ) : (
                        <Tooltip title="Editar">
                          <IconButton
                            size="small" 
                            variant="text" 
                            onClick={(event) => {
                              event.stopPropagation();
                              startUpdate(value);
                            }}
                          >
                            <Edit color="warning"  />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Excluir">
                        <IconButton
                          size="small" 
                          variant="text" 
                          onClick={(event) => {
                            event.stopPropagation();
                            onDelete(value);
                          }}
                        >
                          <Delete color="error"  />
                        </IconButton>
                      </Tooltip>
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </ContainerListItem>
          </List>
        )}
      </ContainerList>
    </Container>
  );
}
