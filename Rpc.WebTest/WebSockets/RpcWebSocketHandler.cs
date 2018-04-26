using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net.WebSockets;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Newtonsoft.Json.Serialization;
using Rpc.Core;

namespace Rpc.WebTest.WebSockets
{
    public class RpcWebSocketHandler
    {
        private readonly WebSocket _socket;
        private readonly Rpc<string, ResponseMessage, RequestMessage> _rpc;
        private readonly CancellationTokenSource _tokenSource;

        public RpcWebSocketHandler(WebSocket socket)
        {
            _socket = socket;
            _tokenSource = new CancellationTokenSource();
            _rpc = new Rpc<string, ResponseMessage, RequestMessage>(SendAction, () => Guid.NewGuid().ToString());

            _rpc.RegisterMethod(this, nameof(ReverseString));
            _rpc.RegisterMethod(this, nameof(Add));
        }

        private Task SendAction(byte[] bytes)
        {
            return _socket.SendAsync(bytes, WebSocketMessageType.Binary, true, _tokenSource.Token);
        }

        public async Task ReceiveLoop()
        {
            var buffer = new byte[1024 * 4];
            var tasks = new HashSet<Task>();

            while (!_tokenSource.IsCancellationRequested && !_socket.CloseStatus.HasValue)
            {
                WebSocketReceiveResult result;
                byte[] message;
                using (var ms = new MemoryStream())
                {
                    do
                    {
                        result = await _socket.ReceiveAsync(buffer, _tokenSource.Token);
                        await ms.WriteAsync(buffer, 0, result.Count);
                    } while (!result.EndOfMessage);
                    message = ms.ToArray();
                }

                tasks.Add(Task.Factory.StartNew(() => _rpc.ProcessMessage(message)));
            }

            await Task.WhenAll(tasks);
        }

        public string ReverseString(string input)
        {
            return string.Join("", input.Reverse());
        }

        public long Add(long a)
        {
            var b = (long) _rpc.Call("getB").Result;
            return a + b;
        }
    }
}
