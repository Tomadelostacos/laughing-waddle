export interface Branch{
    nom: string;
    url: string;
    auteur: string;
    dernier_commit: Date;
    nom_commit: string;
}

export interface GitlabBranch{
    name: string;
    author_name: string;
    commit: { committed_date: Date; author_name: string; title: string; web_url: string; };
}

export class BrancheFactory{
    static fromGitlabBranchToBranch(gitlabBranch: GitlabBranch): Branch{
        return {
            nom: gitlabBranch.name,
            url: gitlabBranch.commit.web_url,
            auteur: gitlabBranch.commit.author_name,
            dernier_commit: gitlabBranch.commit.committed_date,
            nom_commit: gitlabBranch.commit.title
          };
    }
}