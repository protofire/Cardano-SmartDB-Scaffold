// types.ts

export const basicTypes = ['String', 'Int', 'Float', 'Boolean', 'ID'] as const;

export const lucidCardanoTypes = [
    'PolicyId',
    'Address',
    'RewardAddress',
    'PaymentKeyHash',
    'StakeKeyHash',
    'KeyHash',
    'VrfKeyHash',
    'ScriptHash',
    'TxHash',
    'Datum',
    'DatumHash',
    'Redeemer',
    'Lovelace',
    'Label',
    'TransactionWitnesses',
    'Transaction',
    'PrivateKey',
    'PublicKey',
    'ScriptRef',
    'Payload',
    'UTxO',
    'OutRef',
    'AddressType',
    'Network',
    'AddressDetails',
    'Delegation',
    'UnixTime',
] as const;

export const smartDbTypes = ['TxOutRef', 'Maybe', 'MinMaxDef', 'PaymentPubKey', 'StakeCredentialPubKeyHash', 'PaymentAndStakePubKeyHash', 'AC', 'CS', 'TN', 'POSIXTime'] as const;

export const typesWithSubtypes = ['Maybe', 'MinMaxDef'] as const;

export type EntityType = 'entity' | 'smartDBEntity';
export type TypeCategory = 'Normal' | 'Special';
export type SpecialTypeSource = 'From Lucid Cardano' | 'From Smart DB' | 'Custom';
export type BasicType = (typeof basicTypes)[number];
export type LucidCardanoType = (typeof lucidCardanoTypes)[number];
export type SmartDbType = (typeof smartDbTypes)[number];
export type TypeWithSubtype = (typeof typesWithSubtypes)[number];

export interface EntityAnswers {
    entityName: string;
    entityType: EntityType;
    hasIndexes?: boolean;
    indexes?: string[];
    fields: FieldAnswers[];
}

export interface TypeSelection {
    typeCategory: TypeCategory;
    type?: BasicType | SpecialTypeSource;
    lucidType?: LucidCardanoType;
    smartDbType?: SmartDbType;
    customType?: string;
    customTypeImport?: string;
    subtype?: TypeSelection;
}

export interface FieldAnswers extends TypeSelection {
    name: string;
    isNullable: boolean;
    isDatumField?: boolean;
    setDefault?: boolean;
    defaultValue?: string;
    addAnotherField: boolean;
}
