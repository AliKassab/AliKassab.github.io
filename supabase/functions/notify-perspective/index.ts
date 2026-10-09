import { createHandler } from './handler.ts';

Deno.serve(createHandler({
    getSecret: name => Deno.env.get(name),
    send: fetch,
}));
