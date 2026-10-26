import { apiRequest, ApiMeta } from './client';
import type { BackendCrewRole, BackendShoot, BackendShootStatus, BackendShootType } from './shoots';
import type { BackendTask, BackendTaskCategory, BackendTaskPriority, BackendTaskStatus } from './tasks';
import type { PaymentMethod } from './payments';
export type BackendProjectStatus='UPCOMING'|'LEAD'|'CONFIRMED'|'PLANNING'|'SHOOTING'|'EDITING'|'DELIVERY'|'COMPLETED'|'CANCELLED';
export type BackendProjectType='ROKA'|'ENGAGEMENT'|'PRE_WEDDING'|'WEDDING'|'COMPLETE_WEDDING_SERVICES'|'HALDI_MEHENDI'|'SANGEET'|'RECEPTION'|'ANNIVERSARY'|'CORPORATE'|'OTHER';
export interface ProjectClient { id:string; clientCode:string; displayName:string; primaryPhone:string; }
export interface ProjectPayment { id:string; paymentDate:string; amount:string|number; paymentMethod:string; notes?:string|null; receiptFileId?:string|null; }
export interface PaymentMilestone { id:string; title:string; amount:string|number; percentage:string|number; dueDate:string|null; status:'PENDING'|'RECEIVED'|'OVERDUE'; notes?:string|null; }
export interface Project { id:string; projectNumber:string; name:string; type:BackendProjectType; status:BackendProjectStatus; isUrgent:boolean; weddingDate:string|null; deliveryDueDate:string|null; venueName:string|null; venueAddress:string|null; venueCity:string|null; totalQuotation:string; totalStorageCapacityGb?:string|number; paymentMode?:PaymentMethod|null; customServiceType:string|null; otherClientDetails:string|null; notes:string|null; client:ProjectClient; tasks?:BackendTask[]; shoots?:BackendShoot[]; payments?:ProjectPayment[]; paymentMilestones?:PaymentMilestone[]; dataBackup?:unknown; deliveryStatus?:unknown; createdAt:string; updatedAt:string; _count?:{events:number;shoots:number;tasks:number;deliveries:number}; }
export interface CreateProjectEventInput {name:string;eventDate:string;venueName?:string;address?:string;city?:string;notes?:string;}
export interface CreateProjectClientInput {displayName:string;primaryPhone:string;primaryEmail?:string;}
export interface CreateProjectTaskInput {title:string;description?:string;category?:BackendTaskCategory;priority?:BackendTaskPriority;quantity?:number;unit?:string;dueDate?:string;assigneeId?:string;status?:BackendTaskStatus;}
export interface CreateProjectShootAssignmentInput {userId:string;role:BackendCrewRole;}
export interface PaymentMilestoneInput {title:string;amount:number;percentage:number;dueDate:string;status:'PENDING'|'RECEIVED'|'OVERDUE';notes?:string;}
export interface CreateProjectShootInput {title:string;shootDate:string;startTime?:string;endTime?:string;location?:string;city?:string;notes?:string;shootType?:BackendShootType;status?:BackendShootStatus;plannedRoleSlots?:Array<{role:string;requiredCount:number;name?:string;mobile?:string;dataReceived?:boolean;dataSizeGb?:string|number;copyInHD?:string;backupInHD?:string}>;crewAssignments?:CreateProjectShootAssignmentInput[];}
export interface CreateProjectInput {clientId?:string;client?:CreateProjectClientInput;name:string;type?:BackendProjectType;status?:BackendProjectStatus;isUrgent?:boolean;weddingDate?:string;deliveryDueDate?:string;venueName?:string;venueAddress?:string;venueCity?:string;totalQuotation?:string;totalStorageCapacityGb?:number;customServiceType?:string;otherClientDetails?:string;notes?:string;managerId?:string;branchId?:string;events?:CreateProjectEventInput[];tasks?:CreateProjectTaskInput[];shoots?:CreateProjectShootInput[];advancePayment?:CreateProjectAdvanceInput;}
/** An advance taken with the booking. The server saves it in the same step as the project, so a failure leaves neither behind. */
export interface CreateProjectAdvanceInput {amount:number;paymentDate:string;paymentMethod?:PaymentMethod;notes?:string;}
export type UpdateProjectInput=Partial<Omit<CreateProjectInput,'clientId'|'client'|'events'|'tasks'|'shoots'|'status'|'advancePayment'>>;
export interface ProjectListQuery {page?:number;limit?:number;search?:string;status?:BackendProjectStatus;type?:BackendProjectType;clientId?:string;managerId?:string;branchId?:string;from?:string;to?:string;sortBy?:string;sortOrder?:'asc'|'desc';}
const query=(q:ProjectListQuery={})=>{const p=new URLSearchParams();Object.entries(q).forEach(([k,v])=>{if(v!==undefined)p.set(k,String(v));});return p.toString()?`?${p}`:'';};
export const projectsApi={
  list:async(q?:ProjectListQuery)=>apiRequest<Project[]>(`/projects${query(q)}`),
  get:async(id:string)=>(await apiRequest<Project>(`/projects/${encodeURIComponent(id)}`)).data,
  /** `idempotencyKey`: sending the same key again (after a timeout, say) returns the first project instead of making another. */
  create:async(input:CreateProjectInput,idempotencyKey?:string)=>(await apiRequest<Project>('/projects',{method:'POST',body:JSON.stringify(input),timeoutMs:60000,...(idempotencyKey?{headers:{'Idempotency-Key':idempotencyKey}}:{})})).data,
  update:async(id:string,input:UpdateProjectInput)=>(await apiRequest<Project>(`/projects/${encodeURIComponent(id)}`,{method:'PATCH',body:JSON.stringify(input)})).data,
  updateDataBackup:async(id:string,dataBackup:unknown)=>(await apiRequest<Project>(`/projects/${encodeURIComponent(id)}/data-backup`,{method:'PATCH',body:JSON.stringify(dataBackup)})).data,
  updateDeliveries:async(id:string,deliveryStatus:unknown)=>(await apiRequest<Project>(`/projects/${encodeURIComponent(id)}/deliveries`,{method:'PATCH',body:JSON.stringify(deliveryStatus)})).data,
  changeStatus:async(id:string,input:{status:BackendProjectStatus;reason?:string})=>(await apiRequest<Project>(`/projects/${encodeURIComponent(id)}/status`,{method:'PATCH',body:JSON.stringify(input)})).data,
  remove:async(id:string)=>apiRequest<void>(`/projects/${encodeURIComponent(id)}`,{method:'DELETE'}),
  listPaymentMilestones:async(projectId:string)=>(await apiRequest<PaymentMilestone[]>(`/projects/${encodeURIComponent(projectId)}/payment-milestones`,{timeoutMs:30000,fresh:true})).data,
  createPaymentMilestone:async(projectId:string,input:PaymentMilestoneInput)=>(await apiRequest<PaymentMilestone>(`/projects/${encodeURIComponent(projectId)}/payment-milestones`,{method:'POST',body:JSON.stringify(input),timeoutMs:60000})).data,
  updatePaymentMilestone:async(projectId:string,milestoneId:string,input:PaymentMilestoneInput)=>(await apiRequest<PaymentMilestone>(`/projects/${encodeURIComponent(projectId)}/payment-milestones/${encodeURIComponent(milestoneId)}`,{method:'PATCH',body:JSON.stringify(input),timeoutMs:60000})).data,
  removePaymentMilestone:async(projectId:string,milestoneId:string,milestones?:unknown[])=>apiRequest<void>(`/projects/${encodeURIComponent(projectId)}/payment-milestones/${encodeURIComponent(milestoneId)}`,{method:'DELETE',body:JSON.stringify({milestones}),timeoutMs:60000})
};
export type ProjectListResult={data:Project[];meta:ApiMeta};
