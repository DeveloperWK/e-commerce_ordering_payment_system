export interface LogInUserDTO {
	email: string;
	password: string;
}

export interface LogInResponse {
	userId: string;
	token: string;
	role: string;
}
