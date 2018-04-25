using System;

namespace Rpc.Core
{
    public class RpcCallException<TKey> : InvalidOperationException
        where TKey : IEquatable<TKey>
    {
        public IMessage<TKey> RelatedMessage { get; }

        public object Response => (RelatedMessage as IResponseMessage<TKey>)?.Response;

        public RpcCallException(IMessage<TKey> message)
        {
            RelatedMessage = message;
        }
    }
}
