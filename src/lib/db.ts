const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

interface DbResponse<T> {
  data?: T;
  error?: string;
}

export async function dbCall<T>(action: string, params: Record<string, unknown> = {}): Promise<DbResponse<T>> {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/db`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action, ...params }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      return { error: result.error || 'Unknown error' };
    }
    
    return { data: result.data };
  } catch (error) {
    console.error('DB call error:', error);
    return { error: error instanceof Error ? error.message : 'Network error' };
  }
}
