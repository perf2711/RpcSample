using System;

namespace Rpc.Core
{
    public interface IResponseMessage<TKey> : IMessage<TKey>
        where TKey : IEquatable<TKey>
    {
        bool Successful { get; set; }
        object Response { get; set; }
    }
}
