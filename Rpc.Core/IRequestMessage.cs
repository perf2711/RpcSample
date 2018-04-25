using System;
using System.Collections.Generic;

namespace Rpc.Core
{
    public interface IRequestMessage<TKey> : IMessage<TKey>
        where TKey : IEquatable<TKey>
    {
        string MethodName { get; set; }
        IEnumerable<object> MethodArguments {get; set; }
    }
}
