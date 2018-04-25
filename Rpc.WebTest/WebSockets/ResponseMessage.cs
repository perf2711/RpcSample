using Rpc.Core;

namespace Rpc.WebTest.WebSockets
{
    public class ResponseMessage : IResponseMessage<string>
    {
        public string Id { get; set; }
        public object Response { get; set; }
        public bool Successful { get; set; }
    }
}
