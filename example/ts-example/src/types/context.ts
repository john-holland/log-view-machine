import { Request } from 'express';
import { SkinService } from '../services/skin-service';
import { UserService } from '../services/user-service';
import { BurgerService } from '../services/burger-service';
import { CartService } from '../services/cart-service';

export interface User {
    id: number;
    username: string;
    email: string;
    created_at: Date;
    updated_at: Date;
}

export interface GraphQLContext {
    req: Request;
    user?: User;
    skinService: SkinService;
    userService: UserService;
    burgerService: BurgerService;
    cartService: CartService;
} 