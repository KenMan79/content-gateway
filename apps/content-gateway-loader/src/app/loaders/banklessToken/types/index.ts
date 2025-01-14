import { AdditionalProperties, CollectionOf, Required } from "@tsed/schema";

export const info = {
    namespace: "bankless-token",
    name: "BANKAccount",
    version: "V1",
}

export class Transaction {
    @Required(true)
    fromAddress: string;
    @Required(true)
    toAddress: string;
    @Required(true)
    amount: number;
}

@AdditionalProperties(false)
export class BANKAccount {
    @Required(true)
    id: string;
    @Required(true)
    address: string;
    @Required(true)
    balance: number;
    @Required(true)
    @CollectionOf(Transaction)
    transactions: Transaction[];
}

@AdditionalProperties(false)
export class BanklessTokenIndex {
    @Required(true)
    id: string;
    @Required(true)
    @CollectionOf(BANKAccount)
    accounts: BANKAccount[];
}