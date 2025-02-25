import { create } from 'zustand';
import { Todo } from '../utils/todoReducer';

interface TodoStore {
  todos: Todo[];
  loading: boolean;
  error: string | null;
  addTodo: (text: string) => void;
  toggleTodo: (id: string) => void;
  removeTodo: (id: string) => void;
  fetchTodos: () => Promise<void>;
}

export const useTodoStore = create<TodoStore>((set) => ({
  todos: [],
  loading: false,
  error: null,

  addTodo: (text) => set((state) => ({
    todos: [...state.todos, { id: Date.now().toString(), text, done: false }]
  })),

  toggleTodo: (id) => set((state) => ({
    todos: state.todos.map(todo => 
      todo.id === id ? { ...todo, done: !todo.done } : todo
    )
  })),

  removeTodo: (id) => set((state) => ({
    todos: state.todos.filter(todo => todo.id !== id)
  })),

  fetchTodos: async () => {
    set({ loading: true });
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      if (Math.random() > 0.5) throw new Error("Failed to fetch todos");
      
      set({ 
        todos: [
          { id: "1", text: "Learn React", done: false },
          { id: "2", text: "Build an app", done: false }
        ],
        error: null
      });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "An error occurred" });
    } finally {
      set({ loading: false });
    }
  }
}));