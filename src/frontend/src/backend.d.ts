import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Stats {
    totalQuestions: bigint;
    totalVariants: bigint;
}
export interface Variant {
    id: bigint;
    decimalMode: boolean;
    masterId: bigint;
    correctIndex: bigint;
    createdAt: bigint;
    mcqOptions: Array<string>;
    answer: string;
    questionText: string;
    fractionMode: boolean;
}
export interface MasterQuestion {
    id: bigint;
    topic: string;
    subject: string;
    solutionSteps: Array<string>;
    createdAt: bigint;
    text: string;
    originalNumbers: Array<string>;
    chapter: string;
}
export interface backendInterface {
    createMasterQuestion(text: string, subject: string, chapter: string, topic: string, solutionSteps: Array<string>, originalNumbers: Array<string>): Promise<bigint>;
    createVariant(masterId: bigint, questionText: string, answer: string, mcqOptions: Array<string>, correctIndex: bigint, decimalMode: boolean, fractionMode: boolean): Promise<bigint>;
    deleteMasterQuestion(id: bigint): Promise<void>;
    deleteVariant(id: bigint): Promise<void>;
    exportData(): Promise<string>;
    getMasterQuestion(id: bigint): Promise<MasterQuestion | null>;
    getStats(): Promise<Stats>;
    getVariant(id: bigint): Promise<Variant | null>;
    importData(jsonText: string): Promise<void>;
    listAllMasterQuestions(): Promise<Array<MasterQuestion>>;
    listVariantsByMasterId(masterId: bigint): Promise<Array<Variant>>;
    searchMasterQuestionsByChapter(searchTerm: string): Promise<Array<MasterQuestion>>;
    searchMasterQuestionsBySubject(searchTerm: string): Promise<Array<MasterQuestion>>;
    searchMasterQuestionsByTopic(searchTerm: string): Promise<Array<MasterQuestion>>;
}
