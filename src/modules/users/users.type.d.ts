export interface RegisterUserDTO {
	name: string;
	email: string;
	phone_number: string;
	password: string;
	role?: string;
}

export interface UserResponse {
	userId: string;
	name: string;
	email: string;
	phone_number: string;
	role: string;
	created_at: Date;
}
