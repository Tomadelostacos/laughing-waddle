import { Branch } from "./branche";
import { MergeRequest } from "./merge-request";
import { Pipeline } from "./pipeline";

export interface ProjectInfo{
    id: string;
    nom: string;
    url: string;
    description: string;
    mergeRequests: MergeRequest[];
    pipelines: Pipeline[];
    branches: Branch[];
}