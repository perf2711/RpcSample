using System;
using System.Threading.Tasks;

namespace Rpc.Core
{
    public delegate Task SendHandler<TKey>(IMessage<TKey> message) where TKey : IEquatable<TKey>;

    public delegate TKey CreateKeyHandler<TKey>() where TKey : IEquatable<TKey>;
}
