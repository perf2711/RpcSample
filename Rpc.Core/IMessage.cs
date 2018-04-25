using System;

namespace Rpc.Core
{
    public interface IMessage<TKey>
        where TKey : IEquatable<TKey>
    {
        TKey Id { get; set; }
    }
}
