using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Threading.Tasks;

namespace Rpc.Core
{
    public class Rpc<TKey, TResponseMessage, TRequestMessage>
        where TKey : IEquatable<TKey>
        where TRequestMessage : IRequestMessage<TKey>, new ()
        where TResponseMessage : IResponseMessage<TKey>, new ()

    {
        private readonly Dictionary<string, (object obj, MethodInfo method)> _methods = new Dictionary<string, (object, MethodInfo)>();
        private readonly Dictionary<TKey, TaskCompletionSource<object>> _callbacks = new Dictionary<TKey, TaskCompletionSource<object>>();

        private readonly SendHandler<TKey> _sendHandler;
        private readonly CreateKeyHandler<TKey> _createKeyHandler;

        public Rpc(SendHandler<TKey> sendHandler, CreateKeyHandler<TKey> createKeyHandler)
        {
            _sendHandler = sendHandler ?? throw new ArgumentNullException(nameof(sendHandler));
            _createKeyHandler = createKeyHandler ?? throw new ArgumentNullException(nameof(createKeyHandler));
        }

        public void RegisterMethod(object obj, string methodName, MethodInfo methodInfo = null)
        {
            if (methodInfo == null)
            {
                methodInfo = obj.GetType().GetMethod(methodName) ?? throw new ArgumentException($"Cannot find method with name {methodName}.", nameof(methodName));
            }

            _methods.Add(methodName.ToLower(), (obj, methodInfo));
        }

        public void ProcessRequestMessage(TRequestMessage message)
        {
            if (!_methods.TryGetValue(message.MethodName.ToLower(), out var method))
            {
                _sendHandler.Invoke(CreateErrorResponse(message, $"No method with name {message.MethodName} found."));
                return;
            }

            try
            {
                var result = method.method.Invoke(method.obj, message.MethodArguments.ToArray());
                _sendHandler(CreateSuccessfulResponse(message, result));
            }
            catch (Exception e)
            {
                _sendHandler(CreateErrorResponse(message, e.Message));
            }
        }

        public Task<object> Call(string methodName, params object[] arguments)
        {
            var call = CreateCall(methodName, arguments);
            var promise = new TaskCompletionSource<object>();
            _callbacks.Add(call.Id, promise);
            _sendHandler(call);
            return promise.Task;
        }

        public void ProcessResponseMessage(TResponseMessage message)
        {
            if (!_callbacks.TryGetValue(message.Id, out var promise))
            {
                return;
            }

            if (message.Successful)
            {
                promise.SetResult(message.Response);
            }
            else
            {
                promise.SetException(new RpcCallException<TKey>(message));
            }
        }

        private TRequestMessage CreateCall(string methodName, IEnumerable<object> arguments)
        {
            return new TRequestMessage
            {
                Id = _createKeyHandler(),
                MethodName = methodName,
                MethodArguments = arguments.ToArray()
            };
        }

        private TResponseMessage CreateSuccessfulResponse(TRequestMessage message, object response)
        {
            return new TResponseMessage
            {
                Id = message.Id,
                Successful = true,
                Response = response
            };
        }

        private TResponseMessage CreateErrorResponse(TRequestMessage message, object response)
        {
            return new TResponseMessage
            {
                Id = message.Id,
                Successful = false,
                Response = response
            };
        }
    }
}
