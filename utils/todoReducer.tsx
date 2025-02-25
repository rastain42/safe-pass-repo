export interface Todo {
    id: string;
    text: string;
    done: boolean;
  }
  
  type TodoAction = 
    | { type: 'ADD_TODO'; payload: string }
    | { type: 'TOGGLE_TODO'; payload: string }
    | { type: 'REMOVE_TODO'; payload: string }
    | { type: 'SET_TODOS'; payload: Todo[] };
  
  export function todoReducer(state: Todo[], action: TodoAction): Todo[] {
    switch (action.type) {
      case 'ADD_TODO':
        return [...state, { 
          id: Date.now().toString(), 
          text: action.payload, 
          done: false 
        }];
      
      case 'TOGGLE_TODO':
        return state.map(todo => 
          todo.id === action.payload 
            ? { ...todo, done: !todo.done } 
            : todo
        );
      
      case 'REMOVE_TODO':
        return state.filter(todo => todo.id !== action.payload);
      
      case 'SET_TODOS':
        return action.payload;
        
      default:
        return state;
    }
  }