import { Injectable, Req, Res, UnauthorizedException } from '@nestjs/common';
import { Model } from 'mongoose';
import { User } from 'src/user/schemas/user.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Admin } from './schemas/admin.schema';
import { AdminLoginDto } from './dto/login.dto';
import * as bcrypt from 'bcryptjs';
import { Request, Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import { Host } from 'src/host/schemas/host.schemas';
import { MailerService } from '@nestjs-modules/mailer';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { Vehicles } from './schemas/vehicles.schema';
import { UpdateVehicleDto } from './dto/edit-vehicle.dto';
import * as fs from 'fs';
import { Booking } from 'src/user/schemas/bookings.schema';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel('User')
    private userModel: Model<User>,
    @InjectModel('Admin')
    private adminModel: Model<Admin>,
    @InjectModel('Host')
    private hostModel: Model<Host>,
    @InjectModel('Vehicles')
    private vehicleModel: Model<Vehicles>,
    @InjectModel('Booking')
    private bookingModel: Model<Booking>,
    private jwtservice: JwtService,
    private mailService: MailerService,
  ) {}

  async AdminLogin(logindto: AdminLoginDto, @Res() res: Response) {
    try {
      const { email, password } = logindto;
      const user = await this.adminModel.findOne({ email: email });

      if (!user) {
        return res.status(404).json({ message: 'Admin not found' });
      }

      const passMatch = await bcrypt.compare(password, user.password);
      if (!passMatch) {
        return res.status(401).send({ message: 'Wrong Password' });
      }
      const payload = { id: user._id, role: 'admin' };
      const token = this.jwtservice.sign(payload);
      res.cookie('jwtAdmin', token, {
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
      });
      res.status(200).send({ token: token, message: 'Success' });
    } catch (err) {
      res.status(500).json({ message: 'Internal Error' });
    }
  }

  // async signup(
  //   logindto: AdminLoginDto,
  //   @Res({ passthrough: true }) res: Response,
  // ) {
  //   try {
  //     const { email, password } = logindto;

  //     const hashpass = await bcrypt.hash(password, 10);
  //     const user = await this.AdminModel.create({
  //       email,
  //       password: hashpass,
  //     });

  //     const payload = { id: user._id, role: 'admin' };
  //     const token = this.jwtservice.sign(payload);
  //     res.cookie('jwt', token, {
  //       httpOnly: true,
  //       maxAge: 24 * 60 * 60 * 1000,
  //     });
  //     return { token };
  //   } catch (error) {
  //     res.status(500).json({ message: 'Internal Error' });
  //   }
  // }

  async blockuser(id: string, @Res() res: Response) {
    try {
      const user = await this.userModel.findById({ _id: id });
      if (!user) {
        throw new UnauthorizedException('No user found');
      }
      await this.userModel.findByIdAndUpdate(
        { _id: id },
        { $set: { isBlocked: true } },
      );
      return res.status(200).json({ message: 'Success' });
    } catch (err) {
      res.status(500).json({ message: 'Internal Error' });
    }
  }

  async unblockuser(id: string, @Res() res: Response) {
    try {
      const user = await this.userModel.findById({ _id: id });
      if (!user) {
        throw new UnauthorizedException('No user found');
      }
      await this.userModel.findByIdAndUpdate(
        { _id: id },
        { $set: { isBlocked: false } },
      );
      return res.status(200).json({ message: 'Success' });
    } catch (err) {
      res.status(500).json({ message: 'Internal Error' });
    }
  }

  async getAllUsers(@Res() res: Response) {
    try {
      const user = await this.userModel.find({});
      return user;
    } catch (err) {
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }

  async blockhost(id: string, @Res() res: Response) {
    try {
      const user = await this.hostModel.findById({ _id: id });
      if (!user) {
        throw new UnauthorizedException('No user found');
      }
      await this.hostModel.findByIdAndUpdate(
        { _id: id },
        { $set: { isBlocked: true } },
      );
      return res.status(200).json({ message: 'Success' });
    } catch (err) {
      res.status(500).json({ message: 'Internal Error' });
    }
  }

  async unblockhost(id: string, @Res() res: Response) {
    try {
      const user = await this.hostModel.findById({ _id: id });
      if (!user) {
        throw new UnauthorizedException('No user found');
      }
      await this.hostModel.findByIdAndUpdate(
        { _id: id },
        { $set: { isBlocked: false } },
      );
      return res.status(200).json({ message: 'Success' });
    } catch (err) {
      res.status(500).json({ message: 'Internal Error' });
    }
  }

  async getAllHosts(@Res() res: Response) {
    try {
      const host = await this.hostModel.find({});
      return host;
    } catch (err) {
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }

  async verifyHost(id: any, @Res() res: Response) {
    try {
      const hostData = await this.hostModel.findOne({ _id: id });
      await this.hostModel.findByIdAndUpdate(
        { _id: id },
        { $set: { isVerified: true } },
      );
      await this.sendVerificationMail(hostData.name, hostData.email);
      return res.status(200).json({ message: 'Success' });
    } catch (err) {
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }

  async sendVerificationMail(name: string, email: string) {
    return this.mailService.sendMail({
      to: email,
      from: process.env.DEV_MAIL,
      subject: 'WheelsOnDemand Email Verification',
      text: 'WheelsOnDemand',
      html: ` <table style="max-width: 600px; margin: 0 auto; padding: 20px;">
      <tr>
          <td style="text-align: center; background-color: #1976D2; padding: 10px; color: #fff;">
              <h1>Host Verification Successful</h1>
          </td>
      </tr>
      <tr>
          <td style="padding: 20px;">
              <p>Hello, ${name} </p>
              <p>Your host verification has been successful. You can now access our services and start hosting with us.</p>
              <p>Thank you for choosing our platform. We look forward to having you as part of our community.</p>
              <p>If you have any questions or need assistance, please feel free to contact our support team.</p>
              <p>Best regards,<br>Your WheelsOnDemand Team</p>
          </td>
      </tr>
      <tr>
          <td style="text-align: center; background-color: #1976D2; padding: 10px; color: #fff;">
              <p>&copy; 2023 WheelsOnDemand. All rights reserved.</p>
          </td>
      </tr>
  </table>`,
    });
  }

  async hostNotVerified(id: any, issue: any, @Res() res: Response) {
    try {
      console.log(id, issue.issue, 'from service');
      const hostData = await this.hostModel.findOne({ _id: id });
      console.log(hostData);
      // await this.hostModel.findOneAndDelete({ _id: id });
      await this.sendNotVerificationMail(
        hostData.name,
        hostData.email,
        issue.issue,
      );
      return res.status(200).json({ message: 'Success' });
    } catch (err) {
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }

  async sendNotVerificationMail(name: string, email: string, issue: string) {
    return this.mailService.sendMail({
      to: email,
      from: process.env.DEV_MAIL,
      subject: 'WheelsOnDemand Email Verification',
      text: 'WheelsOnDemand',
      html: `<table style="max-width: 600px; margin: 0 auto; padding: 20px;">
      <tr>
          <td style="text-align: center; background-color: #FF5722; padding: 10px; color: #fff;">
              <h1>Host Verification Failed</h1>
          </td>
      </tr>
      <tr>
          <td style="padding: 20px;">
              <p>Hello, ${name}</p>
              <p>We regret to inform you that your host verification has failed due to the following reason:</p>
              <p>${issue}</p>
              <p>Please review the feedback provided and make the necessary changes to meet our requirements for hosting.</p>
              <p>Once you've addressed the issues, you can reapply for host verification.</p>
              <p>If you have any questions or need further assistance, please contact our support team.</p>
              <p>Best regards,<br>Your WheelsOnDemand Team</p>
          </td>
      </tr>
      <tr>
          <td style="text-align: center; background-color: #FF5722; padding: 10px; color: #fff;">
              <p>&copy; 2023 WheelsOnDemand. All rights reserved.</p>
          </td>
      </tr>
  </table>`,
    });
  }

  async addVehicle(
    files: any,
    createVehicle: CreateVehicleDto,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    try {
      const { name, brand, manuDate, transmission, fuel, price, location } =
        createVehicle;
      const cookie = req.cookies['jwtAdmin'];
      const claims = this.jwtservice.verify(cookie);
      const newVehicle = await this.vehicleModel.create({
        name,
        transmission,
        manuDate,
        fuel,
        brand,
        price,
        location,
        createdBy: claims.id,
      });
      await this.uploadVehicleImage(files.files, res, newVehicle._id);
      await this.uploadVehicleDoc(files.doc[0], res, newVehicle._id);
      res.status(200).json({ message: 'Success' });
    } catch (err) {
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }

  async uploadVehicleImage(files: any, @Res() res: Response, id?: string) {
    try {
      for (const f of files) {
        await this.vehicleModel.findOneAndUpdate(
          { _id: id },
          { $push: { images: f.filename } },
        );
      }
      return;
    } catch (error) {
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }

  async uploadVehicleDoc(doc: any, @Res() res: Response, id?: string) {
    try {
      await this.vehicleModel.findOneAndUpdate(
        { _id: id },
        { $set: { document: doc.filename } },
      );
      return;
    } catch (err) {
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }

  async getAllVehicles(@Res() res: Response, page: number) {
    try {
      const vehicles = await this.vehicleModel
        .find({})
        .populate('createdBy')
      res.status(200).send(vehicles);
    } catch (err) {
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }

  async pagination(@Res() res: Response) {
    try {
      const perPage = 3;
      const count = await this.vehicleModel.countDocuments();
      const totalPage = Math.ceil(count / perPage);
      res.status(200).json({ totalPage });
    } catch (err) {
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }

  async verifyHostVehicle(@Res() res: Response, vid: string, hid: string) {
    try {
      await this.vehicleModel.findByIdAndUpdate(
        { _id: vid },
        { $set: { isVerified: true } },
      );
      const hostData = await this.hostModel.findOne({ _id: hid });
      await this.vehicleVerifiedMail(hostData.email, hostData.name);
      res.status(200).json({ message: 'Success' });
    } catch (err) {
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }

  async vehicleVerifiedMail(email: string, name: string) {
    return this.mailService.sendMail({
      to: email,
      from: process.env.DEV_MAIL,
      subject: 'WheelsOnDemand New Vehicle Request Verification',
      text: 'WheelsOnDemand',
      html: `
        <table style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <tr>
              <td style="text-align: center; background-color: #1976D2; padding: 10px; color: #fff;">
                  <h1>New Vehicle Request Verified</h1>
              </td>
          </tr>
          <tr>
              <td style="padding: 20px;">
                  <p>Hello, ${name} </p>
                  <p>Your new vehicle request has been reviewed and verified by our team.</p>
                  <p>You can now access our services with your new vehicle and start hosting with us.</p>
                  <p>Thank you for choosing our platform. We look forward to having you as part of our community.</p>
                  <p>If you have any questions or need further assistance, please feel free to contact our support team.</p>
                  <p>Best regards,<br>Your WheelsOnDemand Team</p>
              </td>
          </tr>
          <tr>
              <td style="text-align: center; background-color: #1976D2; padding: 10px; color: #fff;">
                  <p>&copy; 2023 WheelsOnDemand. All rights reserved.</p>
              </td>
          </tr>
        </table>
      `,
    });
  }

  async rejectHostVehicle(@Res() res: Response, id: string, issue: string) {
    try {
      const hostData = await this.hostModel.findOne({ _id: id });
      await this.vehicleRejectedMail(hostData.email, hostData.name, issue);
      res.status(200).json({ message: 'Success' });
    } catch (err) {
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }

  async vehicleRejectedMail(email: string, name: string, issue: string) {
    return this.mailService.sendMail({
      to: email,
      from: process.env.DEV_MAIL,
      subject: 'WheelsOnDemand New Vehicle Request Review',
      text: 'WheelsOnDemand',
      html: `
        <table style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <tr>
              <td style="text-align: center; background-color: #FF5722; padding: 10px; color: #fff;">
                  <h1>New Vehicle Request Review</h1>
              </td>
          </tr>
          <tr>
              <td style="padding: 20px;">
                  <p>Hello, ${name} </p>
                  <p>Your new vehicle request has been reviewed by our team, but we encountered an issue that requires your attention.</p>
                  <p>Issue: <b>${issue}</b> </p>
                  <p>You can resubmit your vehicle request by addressing the issue. Please click the button below to resubmit your request:</p>
                  <p><a href="http://localhost:4200" style="text-decoration: none; padding: 10px 20px; background-color: #1976D2; color: #fff;">Resubmit Request</a></p>
                  <p style='margin-top:3px'>If you have any questions or need further assistance, please feel free to contact our support team.</p>
                  <p>Best regards,<br>Your WheelsOnDemand Team</p>
              </td>
          </tr>
          <tr>
              <td style="text-align: center; background-color: #FF5722; padding: 10px; color: #fff;">
                  <p>&copy; 2023 WheelsOnDemand. All rights reserved.</p>
              </td>
          </tr>
        </table>
      `,
    });
  }

  async editVehicle(
    files: any,
    editVehicle: UpdateVehicleDto,
    @Res() res: Response,
    id: string,
  ) {
    try {
      const { name, brand, manuDate, transmission, fuel, price, location } =
        editVehicle;
      await this.vehicleModel.findOneAndUpdate(
        { _id: id },
        { $set: { name, brand, manuDate, transmission, fuel, price, location } },
      );
      await this.uploadVehicleImage(files, res, id);
      res.status(200).json({ message: 'Success' });
    } catch (err) {
      res.status(500).json({ message: 'Internal Error' });
    }
  }

  async deleteImage(@Res() res: Response, id: string, file: string) {
    try {
      const vehicleData = await this.vehicleModel.findOne({ _id: id });
      if (vehicleData.images.length > 1) {
        await this.vehicleModel.findByIdAndUpdate(
          { _id: id },
          { $pull: { images: file } },
        );
        fs.unlink(`./files/${file}`, (err) => {
          if (err) {
            console.log('somethiing went wrong', err);
          } else {
            console.log('unlinked');
          }
        });
      } else {
        return res
          .status(400)
          .json({ message: 'Vehicle should have one image' });
      }
      res.status(200).json({ message: 'Succuss' });
    } catch (err) {
      res.status(500).json({ message: 'Internal Error' });
    }
  }

  async deleteVehicle(@Res() res: Response, id: string) {
    try {
      await this.vehicleModel.findOneAndDelete({ _id: id });
      res.status(200).json({ message: 'Success' });
    } catch (err) {
      res.status(500).json({ message: 'Internal Error' });
    }
  }

  async getAllBookings(@Res() res: Response) {
    try {
      const bookings = await this.bookingModel
        .find({})
        .populate({
          path: 'vehicleId',
          populate: {
            path: 'createdBy',
            model: 'Host',
          },
        })
        .sort({ _id: -1 });
      res.status(200).json({ bookings });
    } catch (err) {
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }

  async logout(@Req() req: Request, @Res() res: Response) {
    try {
      res.cookie('jwtAdmin', '', { maxAge: 0 });
      res.status(200).json({ message: 'Logged out succesfully' });
    } catch (err) {
      res.status(500).json({ message: 'Internal Error' });
    }
  }
}
