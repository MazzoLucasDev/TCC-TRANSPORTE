export interface ITokenService {
    generate(payload: {userId:string , userType:string}) : string;
}