const { AuthenticationError } = require("apollo-server");

function handleValue(argValue, requestVariables) {
  const {
    kind,
  } = argValue;
  let val;

  switch (kind) {
    case 'IntValue':
      val = argValue.value;
      break;

    case 'StringValue':
      val = argValue.value;
      break;

    case 'Variable':
      val = requestVariables[argValue.name.value];
      break;

    default:
      // If I haven't come across it yet, hopefully it just works...
      val = argValue.value;
      break;
  }

  return val;
}

function flattenArgs(apolloArgs, requestVariables) {
  const args = {};

  apolloArgs.forEach((apolloArg) => {
    console.log(JSON.stringify(apolloArg, null, 2));
    const {
      kind,
      name: {
        value: argName,
      },
      value: argValue,
    } = apolloArg;

    switch (kind) {
      case 'Argument':
        args[argName] = handleValue(argValue, requestVariables);
        break;

      default:
        break;
    }
  });

  return args;
}

function booksAuth(user) {
  const validUsers = ['J. R. R. Tolkien'];

  if (validUsers.includes(user)) return;

  throw new AuthenticationError('You are not authorized to use this endpoint.');
}

function parrotAuth(user, args) {
  const validUsers = ['J. R. R. Tolkien'];
  const dictionary = ['Frodo', 'Gandalf', 'Legolas'];

  if (validUsers.includes(user) && dictionary.includes(args.word)) return;

  throw new AuthenticationError('You are not authorized to use that word.');

  return;
}

function endpointAuth(endpoint, user, args) {
  switch (endpoint) {
    case 'books':
      booksAuth(user);
      break;

    case 'parrot':
      parrotAuth(user, args);
      break;

    default:
      throw new AuthenticationError('Unknown endpoint.');
  }
}

function authPlugin() {
  return {
    requestDidStart(requestContext) {
      const {
        context: apolloContext,
        request: {
          variables: requestVariables,
        },
      } = requestContext;

      return {
        didResolveOperation(resolutionContext) {
          const { user } = apolloContext;

          resolutionContext.operation.selectionSet.selections.forEach((selection) => {
            const { value: operationName } = selection.name;
            console.log(user);
            console.log(operationName);
            const args = flattenArgs(selection.arguments, requestVariables);
            endpointAuth(operationName, user, args);
          });
        },
      };
    },
  };
}

module.exports = { authPlugin };
