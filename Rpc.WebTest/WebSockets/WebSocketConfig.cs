using System.Threading;
using Microsoft.AspNetCore.Builder;

namespace Rpc.WebTest.WebSockets
{
    public static class WebSocketConfig
    {
        public static IApplicationBuilder UseRpcWsHandler(this IApplicationBuilder app)
        {
            app.Use(async (context, next) =>
            {
                if (context.Request.Path != "/rpcwebsocket")
                {
                    await next();
                }
                else
                {
                    var socket = await context.WebSockets.AcceptWebSocketAsync();
                    var handler = new RpcWebSocketHandler(socket);
                    await handler.ReceiveLoop();
                    await socket.CloseAsync(socket.CloseStatus.Value, socket.CloseStatusDescription, CancellationToken.None);
                }
            });
            return app;
        }
    }
}
