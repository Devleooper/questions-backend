import { OK_STATUS, UNAUTHORIZED_STATUS, COURSE_NOT_FOUND } from './../utils/constants';
import { OK, UNAUTHORIZED, NOT_FOUND } from 'http-status';
import { Topic } from './../models/topic.models';
import { ICourse, Course } from './../models/course.models';
import { User, IUser } from './../models/auth.models';



export const createCourse = (sessionId: string, request: any): Promise<any> => {
    return User.findOne({ session_id: sessionId }).populate('topic').then((result: IUser) => {
        if (!result.topic) {
            throw { code: UNAUTHORIZED, message: UNAUTHORIZED_STATUS };
        }

        const course = {
            title: request.title,
            owner: result,
            topic: result.topic,
            description: request.description
        } as ICourse;

        return Course.create(course).then((createdCourse: ICourse) => {
            return Topic.updateOne({ _id: result.topic._id }, { $push: { courses: createdCourse } }).then(() => {
                return {
                    code: OK,
                    message: OK_STATUS,
                    created_at: createdCourse.create_date
                }
            });
        })
    });
}

export const enrollCourse = (sessionId: string, id: string): Promise<any> => {
    return Course.findOne({ _id: id }).then((course: ICourse) => {
        if (!course) {
            throw { code: NOT_FOUND, message: COURSE_NOT_FOUND };
        }
        return User.findOne({ session_id: sessionId }).then((result: IUser) => {
            return course.updateOne({ $push: { students: result } }).then(() => {
                return {
                    code: OK,
                    message: OK_STATUS,
                    enrolled_at: new Date()
                }
            });
        })
    })
}