import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from './http.service';

@Injectable({
  providedIn: 'root'
})
export class GitlabService extends HttpService{

  baseURL: string = 'https://gitlab.krj.gie/api/v4/projects/';

  getProject(projectId: string): Observable<any> {
    return this.getRequestWithHeader(this.baseURL + projectId);
  }

  getMergeRequests(projectId: string): Observable<any> {
    return this.getRequestWithHeader(this.baseURL + projectId + '/merge_requests?state=opened');
  }

  getPipelines(projectId: string, perPage?: string|number): Observable<any> {
    if(perPage) return this.getRequestWithHeader(this.baseURL + projectId + '/pipelines?per_page='+perPage)
    return this.getRequestWithHeader(this.baseURL + projectId + '/pipelines');
  }

  postPipeline(projectId: string, ref: string, releaseVersion: string, snapVersion: string): Observable<any> {
    return this.postRequestWithHeader(this.baseURL + projectId + '/pipeline?ref=' + ref, {variables:[{ 'key': 'PMPRELEASE', 'value': releaseVersion }, {'key': 'PMPVRSSNAP', 'value': snapVersion}]});
  }

  getBranches(projectId: string): Observable<any> {
    return this.getRequestWithHeader(this.baseURL + projectId + '/repository/branches');
  }

  getBranchesFilter(projectId: string, filter: string): Observable<any> {
    return this.getRequestWithHeader(this.baseURL + projectId + '/repository/branches?search=' + filter);
  }

  getFile(projectId: string, branch: string, path: string): Observable<any> {
    return this.getRequestWithHeader(this.baseURL + projectId + '/repository/files/'+ encodeURI(path) + '?ref='+ branch);
  }
}
