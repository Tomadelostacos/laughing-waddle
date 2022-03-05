import { Component, OnInit } from '@angular/core';
import { interval } from 'rxjs';
import { take, timeout } from 'rxjs/operators';
import { Branch, BrancheFactory, GitlabBranch } from 'src/app/models/branche';
import { GitlabMergeRequest, MergeRequest, MergeRequestFactory } from 'src/app/models/merge-request';
import { GitlabPipeline, Pipeline, PipelineFactory } from 'src/app/models/pipeline';
import { ProjectInfo } from 'src/app/models/project-info';
import { GitlabService } from 'src/app/services/gitlab.service';
import config from '../../../assets/config.json';

@Component({
  selector: 'app-gitlab',
  templateUrl: './gitlab.component.html',
  styleUrls: ['./gitlab.component.scss']
})
export class GitlabComponent implements OnInit {

  PIPELINE_STATUS_IN_PROGRESS = ['waiting_for_resource', 'preparing', 'pending', 'running'];
  projectIds: Array<string>;
  projectInfos: Array<ProjectInfo>;

  tempTokenGitlab: string;
  availableReleaseBranches: any;
  runningPipeline: any;

  constructor(public gitlabService: GitlabService) {
    this.projectIds = config.projectIds;
    this.projectInfos = [];
    this.tempTokenGitlab = '';
    this.availableReleaseBranches = {};
    this.runningPipeline = {};
  }

  ngOnInit(): void {
    if (localStorage.getItem("tokenGitlab")) {
      this.gitlabService.authorizationBearerToken = localStorage.getItem('tokenGitlab') ?? '';
    }

    if (this.gitlabService.authorizationBearerToken) {
      this.gitlabService.setHeaders();
      this.refreshContent();
    }
  }

  refreshContent(): void {
    this.projectIds.forEach(projectId => {
      this.gitlabService.getProject(projectId).subscribe(response => {
        this.projectInfos.push({
          id: projectId,
          nom: response.name,
          url: response.web_url,
          description: response.description,
          mergeRequests: [],
          pipelines: [],
          branches: []
        });

        this.projectInfos.sort((a:ProjectInfo, b:ProjectInfo) => a.nom.localeCompare(b.nom));

        this.refreshMergeRequests(projectId);
        this.refreshPipelines(projectId);
        this.refreshBranches(projectId);
      });
    });
  }

  putTokenGitlab(): void {
    this.gitlabService.authorizationBearerToken = this.tempTokenGitlab;
    localStorage.setItem('tokenGitlab', this.tempTokenGitlab);
    this.gitlabService.setHeaders();
    this.refreshContent();
  }

  onReleaseSelected(project: string, branch: string, typeOfVersionIncrement: number = 1){
    let readable: any;
    let version = [];

    // First try to get package.json, if it fails then try to retrieve pom.xml
    // For FENG projects
    this.gitlabService.getFile(project, branch, 'package.json').subscribe(file => {
      readable = JSON.parse(atob(file.content));
      version = readable.version.replace('-SNAPSHOT', '').split(".");

      this.computeVersionAndRunPipeline(project, branch, version, typeOfVersionIncrement);
    },
    error => {
      // For JAMS projects
      this.gitlabService.getFile(project, branch, 'pom.xml').subscribe(file => {
        readable = atob(file.content);
        readable = readable.substring(0, readable.indexOf('-SNAPSHOT</version>'));
        version = readable.substring(readable.lastIndexOf('<version>')+9).trim().split(".");
  
        this.computeVersionAndRunPipeline(project, branch, version, typeOfVersionIncrement);
      });
    })
  }

  private computeVersionAndRunPipeline(project: string, branch: string, version: string[], typeOfVersionIncrement: number){
    if(typeOfVersionIncrement == 0){
      version[0] = (parseInt(version[0])+1).toString();
      version[1] = version[2] = "0";
    }
    else if(typeOfVersionIncrement == 1){
      version[1] = (parseInt(version[1])+1).toString();
      version[2] = "0";
    }
    let releaseVersion = version.join(".");

    version[2] = (parseInt(version[2])+1).toString();
    let snapVersion = version.join(".") + "-SNAPSHOT";

    this.gitlabService.postPipeline(project, branch, releaseVersion, snapVersion).subscribe(() => this.refreshPipelines(project));
    this.runningPipeline[project] = "<span>La pipeline a été lancé sur la branche <span class='fw-bold'>" + branch + "</span> pour la release <span class='fw-bold'>" + releaseVersion +"</span> (next snapshot : " + snapVersion + ").</span>";
  }

  private refreshMergeRequests(projectId: string): void{
    let project: ProjectInfo | undefined = this.projectInfos.find((prj: ProjectInfo) =>  prj.id == projectId);
    this.gitlabService.getMergeRequests(projectId).subscribe(mrResponse => {
      let mergeRequests: MergeRequest[] = [];
      mrResponse.forEach((mrResponseElement: GitlabMergeRequest) => {
        mergeRequests.push(MergeRequestFactory.fromGitlabMergeRequestToMergeRequest(mrResponseElement));
      });

      if(project) project.mergeRequests = mergeRequests;
    });
  }

  private refreshPipelines(projectId: string): void{
    let project: ProjectInfo | undefined = this.projectInfos.find((prj: ProjectInfo) =>  prj.id == projectId);
    this.gitlabService.getPipelines(projectId, 5).subscribe(pipelineResponse => {
      let pipelines: Pipeline[] = [];
      pipelineResponse.forEach((pipelineResponseElement: GitlabPipeline) => {
        pipelines.push(PipelineFactory.fromGitlabPipelineToPipeline(pipelineResponseElement));
      });

      if(project) project.pipelines = pipelines;

      // Si au moins une pipeline est en cours, on prévoit de refresh les pipelines dans x secondes pour refresh le status
      if(pipelines.find((pipeline: Pipeline) => this.PIPELINE_STATUS_IN_PROGRESS.includes(pipeline.status))){
        interval(1000*30).pipe(take(1)).subscribe(() => this.refreshPipelines(projectId));
      }else{
        this.runningPipeline[projectId] = undefined;
        delete this.runningPipeline[projectId];
      }
    });
  }

  private refreshBranches(projectId: string): void{
    this.availableReleaseBranches[projectId] = [];
    this.gitlabService.getBranchesFilter(projectId, "^version").subscribe(branchesResponse => {
      branchesResponse.forEach((branche: any) => this.availableReleaseBranches[projectId].push(branche.name))
    });

    this.gitlabService.getBranches(projectId).subscribe(branchesResponse => {
      let project: ProjectInfo | undefined = this.projectInfos.find((prj: ProjectInfo) =>  prj.id == projectId);
      let branches: Branch[] = [];
      branchesResponse.forEach((branch: GitlabBranch) => {
        branches.push(BrancheFactory.fromGitlabBranchToBranch(branch));
      });

      if(project) project.branches = branches;
    });
  }
}
