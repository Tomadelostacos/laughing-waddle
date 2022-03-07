export interface MergeRequest{
    conflicts: boolean;
    auteur: string;
    avatar: string;
    url: string;
    source: string;
    target: string;
    date: Date;
    titre: string;
    statut: string;
}

export interface GitlabMergeRequest{
    author: { name: string; avatar_url: string }; 
    has_conflicts: boolean;
    web_url: string;
    source_branch: string;
    target_branch: string;
    created_at: Date;
    title: string; 
    merge_status: string;
}

export class MergeRequestFactory{
    static fromGitlabMergeRequestToMergeRequest(gitlabMR: GitlabMergeRequest): MergeRequest{
        return {
            auteur: gitlabMR.author.name,
            avatar: gitlabMR.author.avatar_url,
            conflicts: gitlabMR.has_conflicts,
            url: gitlabMR.web_url,
            source: gitlabMR.source_branch,
            target: gitlabMR.target_branch,
            date: gitlabMR.created_at,
            titre: gitlabMR.title,
            statut: gitlabMR.merge_status
        };
    }
}