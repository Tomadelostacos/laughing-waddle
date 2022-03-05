export interface Pipeline{
    url: string;
    branche: string;
    date: Date;
    status: string;
}

export interface GitlabPipeline{
    web_url: string;
    ref: string;
    created_at: Date;
    status: string;
}

export class PipelineFactory{
    static fromGitlabPipelineToPipeline(gitlabPipeline: GitlabPipeline): Pipeline{
        return {
            url: gitlabPipeline.web_url,
            branche: gitlabPipeline.ref,
            date: gitlabPipeline.created_at,
            status: gitlabPipeline.status
        };
    }
}