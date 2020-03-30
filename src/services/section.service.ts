import { COURSE_NOT_FOUND, OK_STATUS, SECTION_NOT_FOUND } from './../utils/constants';
import { NOT_FOUND, OK, INTERNAL_SERVER_ERROR } from 'http-status';
import { Course } from './../models/course.models';
import { Section, ISection } from './../models/section.model';

const getAsBuffer = (base64String: string) => {
    if (base64String)
        return new Buffer(base64String, 'base64');
    return undefined;
}

export const findSection = async (sectionId: string): Promise<ISection> => {
    try {
        const section = Section.findOne({ _id: sectionId }, { __v: 0 }).populate({
            path: 'questions example',
            model: 'question',
            populate: [{
                path: 'options',
                model: 'option',
                select: '-__v -question -section'
            }, {
                path: 'answer',
                model: 'option',
                select: ' -__v -question -section'
            }],
            select: '-section -__v'
        }).populate({
            path: 'sharedOptions',
            model: 'option',
            select: '-__v -question -section'
        })

        if (!section) {
            throw { code: NOT_FOUND, status: SECTION_NOT_FOUND };
        }

        return section;
    } catch (err) {
        if (err.code)
            throw err;
        else
            throw { code: INTERNAL_SERVER_ERROR, status: err.toString() };
    }
}


export const createSection = async (request: any, courseId: string): Promise<{ code: number, status: string, additional_information?: any }> => {
    try {
        const courseResult = await Course.findById(courseId);
        if (!courseResult)
            throw { code: NOT_FOUND, status: COURSE_NOT_FOUND };
        const result = await Section.create({
            course: courseResult,
            type: request.type,
            context: request.context,
            buffer: getAsBuffer(request.image)
        });
        await courseResult.updateOne({ $push: { sections: result } });
        return { code: OK, status: OK_STATUS, additional_information: { _id: result._id } };
    }
    catch (err) {
        if (err.code)
            throw err;
        else
            throw { code: INTERNAL_SERVER_ERROR, status: err.toString() };
    }
}


export const addQuestion = async (questionId: string, sectionId: string): Promise<{ code: number, status: string, additional_information?: any }> => {
    try {
        const result = await Section.findById(sectionId);
        if (!result)
            throw { code: NOT_FOUND, status: SECTION_NOT_FOUND };
        const updateResult = await result.updateOne({ $push: { questions: questionId } });
        return { code: OK, status: OK_STATUS, additional_information: updateResult };
    }
    catch (err) {
        if (err.code)
            throw err;
        else
            throw { code: INTERNAL_SERVER_ERROR, status: err.toString() };
    }
}

export const addSharedOption = async (optionId: string, sectionId: string): Promise<{ code: number, status: string, additional_information?: any }> => {
    try {
        const result = await Section.findById(sectionId);
        if (!result)
            throw { code: NOT_FOUND, status: SECTION_NOT_FOUND };
        const updateResult = await result.updateOne({ $push: { sharedOptions: optionId } });
        return { code: OK, status: OK_STATUS, additional_information: updateResult };
    }
    catch (err) {
        if (err.code)
            throw err;
        else
            throw { code: INTERNAL_SERVER_ERROR, status: err.toString() };
    }
}

export const updateSection = async (request: any, sectionId: string): Promise<{ code: number, status: string, additional_information?: any }> => {
    if (request.image) {
        request.buffer = getAsBuffer(request.image);
        request.image = undefined;
    }
    try {
        const result = await Section.update({ _id: sectionId }, request);
        return { code: OK, status: OK_STATUS, additional_information: result };
    }
    catch (err) {
        throw { code: INTERNAL_SERVER_ERROR, status: err.toString() };
    }
}


export const deleteSection = async (sectionId: string): Promise<{ code: number, status: string, additional_information?: any }> => {
    const result = await Section.findOneAndDelete({ _id: sectionId });
    return { code: OK, status: OK_STATUS, additional_information: { _id: result._id } };
}