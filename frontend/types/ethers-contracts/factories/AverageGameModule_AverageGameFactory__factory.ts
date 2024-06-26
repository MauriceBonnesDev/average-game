/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import {
  Contract,
  ContractFactory,
  ContractTransactionResponse,
  Interface,
} from "ethers";
import type { Signer, ContractDeployTransaction, ContractRunner } from "ethers";
import type { NonPayableOverrides } from "../common";
import type {
  AverageGameModule_AverageGameFactory,
  AverageGameModule_AverageGameFactoryInterface,
} from "../AverageGameModule_AverageGameFactory";

const _abi = [
  {
    inputs: [],
    name: "ERC1167FailedCreateClone",
    type: "error",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "gameCount",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "gameAddress",
        type: "address",
      },
    ],
    name: "GameCreated",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_address",
        type: "address",
      },
      {
        internalType: "string",
        name: "_name",
        type: "string",
      },
      {
        internalType: "uint16",
        name: "_maxPlayers",
        type: "uint16",
      },
      {
        internalType: "uint256",
        name: "_betAmount",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_gameFee",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_icon",
        type: "uint256",
      },
    ],
    name: "createAverageGame",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_index",
        type: "uint256",
      },
    ],
    name: "getGameMasterAt",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getGameMasters",
    outputs: [
      {
        internalType: "address[]",
        name: "",
        type: "address[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getGameProxies",
    outputs: [
      {
        internalType: "address[]",
        name: "",
        type: "address[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_index",
        type: "uint256",
      },
    ],
    name: "getGameProxyAt",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalGames",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

const _bytecode =
  "0x60806040526000805534801561001457600080fd5b50610910806100246000396000f3fe608060405234801561001057600080fd5b50600436106100625760003560e01c80632c4e591b14610067578063334a5689146100835780635bed391e146100ae5780639e5aef0a146100c3578063a497ec86146100d6578063b2b58421146100e9575b600080fd5b61007060005481565b6040519081526020015b60405180910390f35b610096610091366004610628565b6100f1565b6040516001600160a01b03909116815260200161007a565b6100b6610121565b60405161007a9190610641565b6100966100d1366004610628565b610183565b6100966100e43660046106b6565b610198565b6100b66104a2565b600060028281548110610106576101066107b2565b6000918252602090912001546001600160a01b031692915050565b6060600280548060200260200160405190810160405280929190818152602001828054801561017957602002820191906000526020600020905b81546001600160a01b0316815260019091019060200180831161015b575b5050505050905090565b600060018281548110610106576101066107b2565b600060038561ffff16101561021a5760405162461bcd60e51b815260206004820152603960248201527f4d696e64657374656e73203320537069656c6572206dc3bc7373656e20616d2060448201527f537069656c207465696c6e65686d656e206bc3b66e6e656e210000000000000060648201526084015b60405180910390fd5b6127108561ffff16111561028c5760405162461bcd60e51b815260206004820152603360248201527f4d6178696d616c2031302e30303020537069656c65722064c3bc7266656e20616044820152726d20537069656c207465696c6e65686d656e2160681b6064820152608401610211565b6102bf604051806040016040528060128152602001714372656174696e672047616d65212121212160701b815250610502565b60006102ca88610548565b90506102f36040518060400160405280600681526020016510db1bdb995960d21b815250610502565b6001805480820182556000919091527fb10e2d527612073b26eecdfd717e6a320cf44b4afac2b0732d9fcbe2b7fa0cf60180546001600160a01b0319166001600160a01b03831617905560408051808201909152600b81526a23b0b6b29026b0b9ba32b960a91b602082015261036990336105ba565b6002805460018101825560009182527f405787fa12a823e0f2b7631cc41b3ba8828b3321ca811111fa75cd3aa3bb5ace0180546001600160a01b03191633908117909155815460405163db3713cf60e01b81526001600160a01b0385169363db3713cf936103e993928d92916103e8918e918e918e908e9060040161080e565b600060405180830381600087803b15801561040357600080fd5b505af1158015610417573d6000803e3d6000fd5b505060008054925090508061042b8361086f565b9091555050600080546040516001600160a01b038416927fc3e0f84839dc888c892a013d10c8f9d6dc05a21a879d0ce468ca558013e9121c91a36104976040518060400160405280601081526020016f125b9a5d0819d85b594818d85b1b195960821b815250826105ba565b979650505050505050565b60606001805480602002602001604051908101604052809291908181526020018280548015610179576020028201919060005260206000209081546001600160a01b0316815260019091019060200180831161015b575050505050905090565b610545816040516024016105169190610896565b60408051601f198184030181529190526020810180516001600160e01b031663104c13eb60e21b179052610603565b50565b6000763d602d80600a3d3981f3363d3d373d3d3d363d730000008260601b60e81c176000526e5af43d82803e903d91602b57fd5bf38260781b17602052603760096000f090506001600160a01b0381166105b5576040516330be1a3d60e21b815260040160405180910390fd5b919050565b6105ff82826040516024016105d09291906108b0565b60408051601f198184030181529190526020810180516001600160e01b031663319af33360e01b179052610603565b5050565b6105458160006a636f6e736f6c652e6c6f679050600080835160208501845afa505050565b60006020828403121561063a57600080fd5b5035919050565b6020808252825182820181905260009190848201906040850190845b818110156106825783516001600160a01b03168352928401929184019160010161065d565b50909695505050505050565b634e487b7160e01b600052604160045260246000fd5b803561ffff811681146105b557600080fd5b60008060008060008060c087890312156106cf57600080fd5b86356001600160a01b03811681146106e657600080fd5b9550602087013567ffffffffffffffff8082111561070357600080fd5b818901915089601f83011261071757600080fd5b8135818111156107295761072961068e565b604051601f8201601f19908116603f011681019083821181831017156107515761075161068e565b816040528281528c602084870101111561076a57600080fd5b826020860160208301376000602084830101528099505050505050610791604088016106a4565b9350606087013592506080870135915060a087013590509295509295509295565b634e487b7160e01b600052603260045260246000fd5b6000815180845260005b818110156107ee576020818501810151868301820152016107d2565b506000602082860101526020601f19601f83011685010191505092915050565b60006101208b83528060208401526108288184018c6107c8565b60ff9a909a166040840152505061ffff968716606082015294909516608085015260a08401929092526001600160a01b031660c083015260e0820152610100015292915050565b60006001820161088f57634e487b7160e01b600052601160045260246000fd5b5060010190565b6020815260006108a960208301846107c8565b9392505050565b6040815260006108c360408301856107c8565b905060018060a01b0383166020830152939250505056fea26469706673582212205fdfa54824acb9613ededa86a85d514dfb7996abf1cc84c7a345d7f7ef9d405164736f6c63430008180033";

type AverageGameModule_AverageGameFactoryConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: AverageGameModule_AverageGameFactoryConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class AverageGameModule_AverageGameFactory__factory extends ContractFactory {
  constructor(...args: AverageGameModule_AverageGameFactoryConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
  }

  override getDeployTransaction(
    overrides?: NonPayableOverrides & { from?: string }
  ): Promise<ContractDeployTransaction> {
    return super.getDeployTransaction(overrides || {});
  }
  override deploy(overrides?: NonPayableOverrides & { from?: string }) {
    return super.deploy(overrides || {}) as Promise<
      AverageGameModule_AverageGameFactory & {
        deploymentTransaction(): ContractTransactionResponse;
      }
    >;
  }
  override connect(
    runner: ContractRunner | null
  ): AverageGameModule_AverageGameFactory__factory {
    return super.connect(
      runner
    ) as AverageGameModule_AverageGameFactory__factory;
  }

  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): AverageGameModule_AverageGameFactoryInterface {
    return new Interface(_abi) as AverageGameModule_AverageGameFactoryInterface;
  }
  static connect(
    address: string,
    runner?: ContractRunner | null
  ): AverageGameModule_AverageGameFactory {
    return new Contract(
      address,
      _abi,
      runner
    ) as unknown as AverageGameModule_AverageGameFactory;
  }
}
