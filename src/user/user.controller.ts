import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { UserService } from './user.service';
import { Signupdto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { Request, Response } from 'express';
import { ChoiseDto } from './dto/choice.dto';
import { CreateBookingDto } from './dto/create-booking.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { editFileName, imageFileFilter } from 'src/file-uploads.utils';
import { UpdateUserDto } from './dto/edit-user.dto';

@Controller('user')
export class AuthController {
  constructor(private userservice: UserService) {}

  @Post('signup')
  signup(
    @Body() signupdto: Signupdto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.userservice.signup(signupdto, res);
  }

  @Post('login')
  login(@Body() logindto: LoginDto, @Res({ passthrough: true }) res: Response) {
    return this.userservice.login(logindto, res);
  }

  @Post('auth/login')
  googlelogin(@Body() user: any, @Res({ passthrough: true }) res: Response) {
    return this.userservice.googleReg(user, res);
  }

  @Get('getuser')
  getUser(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.userservice.getUser(req, res);
  }

  @Post('verify-otp')
  verify(@Res({ passthrough: true }) res: Response, @Body() otp: any) {
    return this.userservice.verifyOtp(res, otp);
  }

  @Put('store-choice')
  storeChoice(
    @Res({ passthrough: true }) res: Response,
    @Body() choicedto: ChoiseDto,
  ) {
    console.log(choicedto);
    return this.userservice.storeChoices(res, choicedto);
  }

  @Get('vehicles')
  getVehicles(
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
    @Query() filter: any,
  ) {
    return this.userservice.getVehicles(res, req, filter);
  }

  @Post('book-vehicle')
  postBooking(
    @Body() createbookingdto: CreateBookingDto,
    @Res() res: Response,
  ) {
    return this.userservice.booking(createbookingdto, res);
  }

  @Get('booking-details/:id')
  getBookingDetails(@Res() res: Response, @Param('id') bookingid: string) {
    return this.userservice.getBooking(res, bookingid);
  }

  @Get('user-booking')
  getUserBooking(@Res() res: Response, @Req() req: Request) {
    return this.userservice.userbookings(res, req);
  }

  @Patch('update-profile')
  @UseInterceptors(
    FileInterceptor('profile', {
      storage: diskStorage({
        destination: './files',
        filename: editFileName,
      }),
      fileFilter: imageFileFilter,
    }),
  )
  updateProfile(
    @Res() res: Response,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
  ) {
    return this.userservice.updateUserProfile(res, req, file);
  }

  @Patch('update-user')
  updateUser(
    @Res() res: Response,
    @Req() req: Request,
    @Body() edituserdto: UpdateUserDto,
  ) {
    this.userservice.updateUser(res, req, edituserdto);
  }

  @Patch('change-password')
  changePass(@Res() res: Response, @Req() req: Request, @Body() data: any) {
    return this.userservice.changePass(res, req, data);
  }

  @Patch('cancel-booking/:b_id')
  cancelBooking(
    @Res() res: Response,
    @Req() req: Request,
    @Body('reason') reason: any,
    @Body('amount') refund: number,
    @Param('b_id') bookId: string,
  ) {
    return this.userservice.cancelBooking(
      res,
      req,
      reason.reason,
      refund,
      bookId,
    );
  }

  @Post('add-review/:v_id')
  addReview(
    @Res() res: Response,
    @Req() req: Request,
    @Param('v_id') v_id: string,
    @Body('review') review: string,
  ) {
    return this.userservice.postReview(res, req, v_id, review);
  }

  @Patch('delete-review/:v_id')
  deleteReview(
    @Res() res: Response,
    @Param('v_id') vid: string,
    @Body('r_id') rid: string,
  ) {
    return this.userservice.deleteReview(res, vid, rid);
  }

  @Post('forgot-password')
  forgotpass(@Res() res: Response, @Body('email') email: string) {
    return this.userservice.forgotpassword(res, email);
  }

  @Patch('reset-password/:u_id')
  resetPassword(
    @Res() res: Response,
    @Param('u_id') userId: string,
    @Body('newpass') newpassword: string,
    @Body('confirmpass') confirmpass: string,
  ) {
    return this.userservice.resetPass(res, userId, newpassword, confirmpass);
  }

  @Get('getVehicles') 
  getAll(@Res() res:Response) {
    return this.userservice.getAllVehicles(res)
  }

  @Post('logout')
  logoutUser(@Req() req: Request, @Res() res: Response) {
    return this.userservice.logout(req, res);
  }
}
