import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Pool } from "https://deno.land/x/postgres@v0.17.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Connection pool for PostgreSQL
let pool: Pool | null = null;

const getPool = () => {
  if (!pool) {
    const databaseUrl = Deno.env.get('DATABASE_URL');
    if (!databaseUrl) {
      throw new Error('DATABASE_URL is not set');
    }
    pool = new Pool(databaseUrl, 3, true);
  }
  return pool;
};

interface RequestBody {
  action: string;
  table?: string;
  data?: Record<string, unknown>;
  where?: Record<string, unknown>;
  id?: string;
  email?: string;
  password?: string;
  fullName?: string;
  userId?: string;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: RequestBody = await req.json();
    const { action } = body;

    console.log(`DB Action: ${action}`, JSON.stringify(body));

    const pool = getPool();
    const client = await pool.connect();

    try {
      let result: unknown;

      switch (action) {
        // Auth actions
        case 'login': {
          const { email, password } = body;
          const res = await client.queryObject`
            SELECT u.id, u.email, u.full_name, u.created_at,
                   COALESCE(
                     json_agg(json_build_object('role', ur.role)) FILTER (WHERE ur.role IS NOT NULL),
                     '[]'
                   ) as roles
            FROM users u
            LEFT JOIN user_roles ur ON u.id = ur.user_id
            WHERE u.email = ${email} AND u.password_hash = crypt(${password}, u.password_hash)
            GROUP BY u.id
          `;
          if (res.rows.length === 0) {
            return new Response(
              JSON.stringify({ error: 'Invalid login credentials' }),
              { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          result = res.rows[0];
          break;
        }

        case 'signup': {
          const { email, password, fullName } = body;
          
          // Check if user already exists
          const existing = await client.queryObject`
            SELECT id FROM users WHERE email = ${email}
          `;
          if (existing.rows.length > 0) {
            return new Response(
              JSON.stringify({ error: 'User already registered' }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          // Create user with hashed password
          const userRes = await client.queryObject`
            INSERT INTO users (email, password_hash, full_name)
            VALUES (${email}, crypt(${password}, gen_salt('bf')), ${fullName})
            RETURNING id, email, full_name, created_at
          `;
          const user = userRes.rows[0] as { id: string };

          // Check if this is the first user - give admin role
          const countRes = await client.queryObject`SELECT COUNT(*) as count FROM users`;
          const count = (countRes.rows[0] as { count: number }).count;
          
          if (count === 1) {
            await client.queryObject`
              INSERT INTO user_roles (user_id, role) VALUES (${user.id}, 'admin')
            `;
          } else {
            await client.queryObject`
              INSERT INTO user_roles (user_id, role) VALUES (${user.id}, 'view_only')
            `;
          }

          result = user;
          break;
        }

        case 'getUser': {
          const { userId } = body;
          const res = await client.queryObject`
            SELECT u.id, u.email, u.full_name, u.created_at,
                   COALESCE(
                     json_agg(json_build_object('role', ur.role)) FILTER (WHERE ur.role IS NOT NULL),
                     '[]'
                   ) as roles
            FROM users u
            LEFT JOIN user_roles ur ON u.id = ur.user_id
            WHERE u.id = ${userId}::uuid
            GROUP BY u.id
          `;
          result = res.rows[0] || null;
          break;
        }

        // Transaction actions
        case 'getTransactions': {
          const { userId, orderBy = 'date', orderDirection = 'DESC' } = body;
          const res = await client.queryObject`
            SELECT * FROM transactions 
            WHERE user_id = ${userId}::uuid
            ORDER BY date DESC, created_at DESC
          `;
          result = res.rows;
          break;
        }

        case 'insertTransaction': {
          const { data } = body;
          const res = await client.queryObject`
            INSERT INTO transactions (user_id, date, type, client_supplier, amount, description, payment_method)
            VALUES (
              ${data!.user_id}::uuid,
              ${data!.date},
              ${data!.type},
              ${data!.client_supplier},
              ${data!.amount},
              ${data!.description},
              ${data!.payment_method}
            )
            RETURNING *
          `;
          result = res.rows[0];
          break;
        }

        case 'updateTransaction': {
          const { id, data } = body;
          const setClauses: string[] = [];
          const values: unknown[] = [];
          
          if (data!.date !== undefined) {
            values.push(data!.date);
            setClauses.push(`date = $${values.length}`);
          }
          if (data!.type !== undefined) {
            values.push(data!.type);
            setClauses.push(`type = $${values.length}`);
          }
          if (data!.client_supplier !== undefined) {
            values.push(data!.client_supplier);
            setClauses.push(`client_supplier = $${values.length}`);
          }
          if (data!.amount !== undefined) {
            values.push(data!.amount);
            setClauses.push(`amount = $${values.length}`);
          }
          if (data!.description !== undefined) {
            values.push(data!.description);
            setClauses.push(`description = $${values.length}`);
          }
          if (data!.payment_method !== undefined) {
            values.push(data!.payment_method);
            setClauses.push(`payment_method = $${values.length}`);
          }
          
          values.push(id);
          const query = `
            UPDATE transactions 
            SET ${setClauses.join(', ')}, updated_at = NOW()
            WHERE id = $${values.length}::uuid
            RETURNING *
          `;
          
          const res = await client.queryObject(query, values);
          result = res.rows[0];
          break;
        }

        case 'deleteTransaction': {
          const { id } = body;
          await client.queryObject`
            DELETE FROM transactions WHERE id = ${id}::uuid
          `;
          result = { success: true };
          break;
        }

        // User management actions
        case 'getAllUsers': {
          const res = await client.queryObject`
            SELECT u.id, u.email, u.full_name, u.created_at,
                   COALESCE(
                     json_agg(json_build_object('id', ur.id, 'role', ur.role)) FILTER (WHERE ur.role IS NOT NULL),
                     '[]'
                   ) as roles
            FROM users u
            LEFT JOIN user_roles ur ON u.id = ur.user_id
            GROUP BY u.id
            ORDER BY u.created_at DESC
          `;
          result = res.rows;
          break;
        }

        case 'updateUserRole': {
          const { userId, data } = body;
          const { role } = data as { role: string };
          
          // Remove existing roles and add new one
          await client.queryObject`
            DELETE FROM user_roles WHERE user_id = ${userId}::uuid
          `;
          await client.queryObject`
            INSERT INTO user_roles (user_id, role) VALUES (${userId}::uuid, ${role})
          `;
          result = { success: true };
          break;
        }

        default:
          return new Response(
            JSON.stringify({ error: `Unknown action: ${action}` }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
      }

      return new Response(
        JSON.stringify({ data: result }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('DB Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
