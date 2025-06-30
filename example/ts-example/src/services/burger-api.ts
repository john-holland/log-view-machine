const API_BASE = 'http://localhost:3001/api';

export interface Burger {
  id: number;
  state: string;
  isHungry: boolean;
  ingredients?: string[];
  totalCost?: number;
  createdAt: string;
  logs: LogEntry[];
}

export interface LogEntry {
  level: string;
  message: string;
  timestamp: string;
  ingredients?: string[];
  totalCost?: number;
}

export class BurgerAPI {
  static async createBurger(isHungry: boolean, ingredients: string[] = []): Promise<Burger> {
    const response = await fetch(`${API_BASE}/burgers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ isHungry, ingredients }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create burger: ${response.statusText}`);
    }
    
    return response.json();
  }

  static async getBurgers(): Promise<Burger[]> {
    const response = await fetch(`${API_BASE}/burgers`);
    
    if (!response.ok) {
      throw new Error(`Failed to get burgers: ${response.statusText}`);
    }
    
    return response.json();
  }

  static async getBurger(id: number): Promise<Burger> {
    const response = await fetch(`${API_BASE}/burgers/${id}`);
    
    if (!response.ok) {
      throw new Error(`Failed to get burger: ${response.statusText}`);
    }
    
    return response.json();
  }

  static async eatBurger(id: number): Promise<Burger> {
    const response = await fetch(`${API_BASE}/burgers/${id}/eat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to eat burger: ${response.statusText}`);
    }
    
    return response.json();
  }

  static async trashBurger(id: number): Promise<Burger> {
    const response = await fetch(`${API_BASE}/burgers/${id}/trash`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to trash burger: ${response.statusText}`);
    }
    
    return response.json();
  }

  static async checkHealth(): Promise<{ status: string; burgers: number }> {
    const response = await fetch('http://localhost:3001/health');
    
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.statusText}`);
    }
    
    return response.json();
  }
} 