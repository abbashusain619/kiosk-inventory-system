type Client = {
  controller: ReadableStreamDefaultController;
};

const clients = new Set<Client>();

export function addClient(controller: ReadableStreamDefaultController) {
  clients.add({ controller });
  return () => clients.delete({ controller });
}

export function broadcastEvent(data: any) {
  const message = `data: ${JSON.stringify(data)}\n\n`;
  for (const client of clients) {
    try {
      client.controller.enqueue(new TextEncoder().encode(message));
    } catch (e) {
      clients.delete(client);
    }
  }
}