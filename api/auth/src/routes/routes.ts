import { Router } from 'express';
import { validateBody } from '@elmariam/utils';
import {
  ApiInfo,
  AuthenticatedUser,
  Login,
  Logout,
  Refresh,
  Register,
  Accounts,
} from '../controllers/auth.js';
import { verifyAdmin } from '../utils/verifyAdmin.js';
import { registerSchema, loginSchema } from '../schemas/auth.schemas.js';

const router: Router = Router();

router.get('/', ApiInfo);
router.post('/register', validateBody(registerSchema), Register);
router.post('/login', validateBody(loginSchema), Login);
router.get('/user', AuthenticatedUser);
router.get('/accounts', verifyAdmin, Accounts);
router.post('/refresh', Refresh);
router.post('/logout', Logout);

export default router;
