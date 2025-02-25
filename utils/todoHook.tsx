import { useState, useEffect } from 'react';

interface Todo {
  id: string;
  text: string; 
  done: boolean;
}
import { useReducer, } from 'react';
import { todoReducer } from './todoReducer';

export function useGetTodoList() {
  const [todos, dispatch] = useReducer(todoReducer, []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTodos = async () => {
    setLoading(true);
    setError(null);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      if (Math.random() > 0.5) throw new Error("Failed to fetch todos");
      dispatch({ type: 'SET_TODOS', payload: [
        { id: "1", text: "Learn React", done: false },
        { id: "2", text: "Build an app", done: false },
      ]});
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodos();
  }, []);

  return {
    todos,
    dispatch,
    loading,
    error,
    retry: fetchTodos
  };
}