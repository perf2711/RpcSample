using System;
using System.Collections.Generic;
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

        private Task SendAction(IMessage<string> obj)
        {
            var json = JsonConvert.SerializeObject(obj, new JsonSerializerSettings
            {
                ContractResolver = new CamelCasePropertyNamesContractResolver()
            });
            var bytes = Encoding.UTF8.GetBytes(json);
            return _socket.SendAsync(bytes, WebSocketMessageType.Text, true, _tokenSource.Token);
        }

        public async Task ReceiveLoop()
        {
            var stringBuilder = new StringBuilder();
            var buffer = new byte[1024 * 4];
            var tasks = new HashSet<Task>();

            while (!_tokenSource.IsCancellationRequested && !_socket.CloseStatus.HasValue)
            {
                WebSocketReceiveResult result;
                do
                {
                    result = await _socket.ReceiveAsync(buffer, _tokenSource.Token);
                    stringBuilder.Append(Encoding.UTF8.GetString(buffer));
                    ZeroBuffer(buffer);
                } while (!result.EndOfMessage);

                var message = stringBuilder.ToString();
                tasks.Add(Task.Factory.StartNew(() => ProcessMessage(message)));

                stringBuilder.Clear();
            }

            await Task.WhenAll(tasks);
        }

        private void ProcessMessage(string message)
        {
            var obj = (JObject) JsonConvert.DeserializeObject(message);
            if (obj.GetValue(nameof(ResponseMessage.Response), StringComparison.OrdinalIgnoreCase) != null)
            {
                _rpc.ProcessResponseMessage(obj.ToObject<ResponseMessage>());
            }
            else
            {
                _rpc.ProcessRequestMessage(obj.ToObject<RequestMessage>());
            }
        }

        private void ZeroBuffer(byte[] buffer)
        {
            for (var i = 0; i < buffer.Length; i++)
            {
                buffer[i] = 0;
            }
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
