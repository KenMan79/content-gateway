import { GraphQLClient } from "@shared/util-data";
import { createLogger } from "@shared/util-fp";
import { DEFAULT_CURSOR, ScheduleMode } from "@shared/util-loaders";
import { Data, NonEmptyProperty } from "@shared/util-schema";
import { DocumentNode } from "graphql";
import gql from "graphql-tag";
import * as t from "io-ts";
import { withMessage } from "io-ts-types";
import { BATCH_SIZE } from "..";
import { GraphQLDataLoaderBase } from "../base/GraphQLDataLoaderBase";
import { notEmpty } from "@shared/util-fp";


const logger = createLogger("MyLogger");

export const URL = "https://api.thegraph.com/subgraphs/name/0xnshuman/bank-subgraph";

const QUERY: DocumentNode = gql`
    query banklessTokenAccounts($limit: Int, $cursor: String) {
        accounts(
            first: $limit
            orderBy: lastTransactionTimestamp
            where: { lastTransactionTimestamp_gt: $cursor }
        ) {
            id
            ERC20balances {
                id
                value
            }
            lastTransactionTimestamp
        }
    }
`;

const INFO = {
    namespace: "bankless-token",
    name: "Account",
    version: "V1",
};

@Data({
    info: INFO,
})
class Account {
    @NonEmptyProperty()
    id: string;
    @NonEmptyProperty()
    balance: string;
    @NonEmptyProperty()
    lastTransactionExecutedAt: string;
}

const ERC20balanceCodec = t.strict({
    id: withMessage(t.string, () => "id is required"),
    value: withMessage(t.string, () => "value is required"),
});

const BANKAccountCodec = t.strict({
    id: withMessage(t.string, () => "id is required"),
    ERC20balances: withMessage(
        t.array(ERC20balanceCodec),
        () => "ERC20balances is required"
    ),
    lastTransactionTimestamp: withMessage(
        t.string,
        () => "lastTransactionTimestamp is required"
    ),
});

const BANKAccountsCodec = t.strict({
    accounts: t.array(BANKAccountCodec),
});

type BANKAccounts = t.TypeOf<typeof BANKAccountsCodec>;

export class BANKAccountLoader extends GraphQLDataLoaderBase<
    BANKAccounts,
    Account
> {
    public info = INFO;
    protected batchSize = BATCH_SIZE;
    protected type = Account;
    protected cadenceConfig = {
        [ScheduleMode.BACKFILL]: { seconds: 5 },
        [ScheduleMode.INCREMENTAL]: { minutes: 5 },
    };

    protected graphQLQuery: DocumentNode = QUERY;
    protected codec = BANKAccountsCodec;

    constructor(client: GraphQLClient) {
        super(client);
    }

    protected mapResult(accounts: BANKAccounts): Array<Account> {
        return accounts.accounts
            .map((account) => {
                let balance = "0";
                if (account.ERC20balances.length > 0) {
                    balance = account.ERC20balances[0].value;
                }
                return {
                    id: account.id,
                    balance: balance,
                    lastTransactionExecutedAt: account.lastTransactionTimestamp,
                };
            })
            .filter(notEmpty);
    }

    protected extractCursor(accounts: BANKAccounts) {
        const obj = accounts.accounts;
        if (obj.length === 0) {
            return DEFAULT_CURSOR;
        }
        return `${obj[obj.length - 1].lastTransactionTimestamp}`;
    }
}
