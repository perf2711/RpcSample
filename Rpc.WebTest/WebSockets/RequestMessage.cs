using System.Collections.Generic;
using Rpc.Core;

namespace Rpc.WebTest.WebSockets
{
    public class RequestMessage : IRequestMessage<string>
    {
        public string Id { get; set; }
        public string MethodName { get; set; }
        public IEnumerable<object> MethodArguments { get; set; }
    }
}
