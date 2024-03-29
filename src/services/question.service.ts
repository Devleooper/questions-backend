import { Section } from './../models/section.model';
import { COURSE_NOT_FOUND, QUESTION_NOT_FOUND, OPTION_NOT_FOUND, OK_STATUS, UNAUTHORIZED_STATUS } from './../utils/constants';
import { NOT_FOUND, INTERNAL_SERVER_ERROR, OK, UNAUTHORIZED } from 'http-status';
import { IQuestion, Question, Option, IOption } from './../models/question.model';


const getAsBuffer = (base64String: string) => {
    if (base64String)
        return Buffer.from(base64String, 'base64');
    return undefined;
}


export const createQuestion = async (request: any, sectionId: string): Promise<any> => {
    try {
        const dbSection = await Section.findOne({ _id: sectionId });
        if (!dbSection) {
            throw { code: NOT_FOUND, status: COURSE_NOT_FOUND };
        }
        const question = await Question.create({
            section: dbSection,
            question: request.question,
        });
        if (!request.example)
            await dbSection.updateOne({ $push: { questions: question } });

        const ids: any[] = [];
        request.options.forEach((option: any) => {
            if (option._id) {
                ids.push(option);
                request.options.splice(request.options.indexOf(option), 1);
                return;
            }
            if (option.image) {
                option.buffer = new Buffer(option.image, 'base64');
                option.image = undefined;
            }
            option.question = question;
            option.section = sectionId;
        });
        const opts: any = await Option.create(...request.options);
        let ans;
        let data: any = [];
        if (opts) {
            ans = opts.find((opt: any) => opt.answer);
            data = data.concat(opts);
        }

        if (!ans) {
            ans = ids.find((opt: any) => opt.answer);
            data = data.concat(ids);
        }

        const result = await question.updateOne({ $push: { options: data }, $set: { answer: ans } });
        if (result.n)
            return { result_id: question._id, option_ids: data.map((option: IOption) => option._id) };
    }
    catch (err) {
        if (err.code)
            throw err;
        else
            throw { code: INTERNAL_SERVER_ERROR, status: err.toString() };
    }
}


export const findQuestion = async (questionId: string, access: string): Promise<IQuestion> => {
    const param = access === 'true' ? '' : '-answer';
    try {
        const result = await Question.findById(questionId, { __v: 0, course: 0, answer: 0, section: 0 }).populate("options", `${param} -question -__v -section`);
        if (!result) {
            throw { code: NOT_FOUND, status: QUESTION_NOT_FOUND };
        }
        return result;
    }
    catch (err) {
        if (err.code)
            throw err;
        else
            throw { code: INTERNAL_SERVER_ERROR, status: err.toString() };
    }
}


export const updateQuestion = async (questionId: string, request: any, access: string): Promise<void> => {
    try {
        if (access !== 'true')
            throw { code: UNAUTHORIZED, status: UNAUTHORIZED_STATUS };
        const result = await Question.findById(questionId).populate("answer");
        if (!result) {
            throw { code: NOT_FOUND, status: QUESTION_NOT_FOUND };
        }
        request.options.forEach(async (option: any) => {
            if (option.updated) {
                await Option.update({ _id: option._id }, { $set: { text: option.text, answer: option.answer } });
            }
        });
        const answerRequest = request.options.find((option: any) => option.answer);
        if (result.answer._id.toString() !== answerRequest._id) {
            result.answer.answer = undefined;
            result.answer.save();
            return await result.updateOne({ $set: { answer: answerRequest, question: request.question } });
        }
        else {
            return await result.updateOne({ $set: { question: request.question } });
        }
    }
    catch (err) {
        if (err.code)
            throw err;
        else
            throw { code: INTERNAL_SERVER_ERROR, status: err.toString() };
    }
}


export const deleteQuestion = async (questionId: string): Promise<void> => {
    try {
        await Question.findOneAndDelete({ _id: questionId });
    }
    catch (err) {
        if (err.code)
            throw err;
        else
            throw { code: INTERNAL_SERVER_ERROR, status: err.toString() };
    }
}

export const createSharedOption = async (request: any, sectionId: string) => {
    try {
        const result = await Section.findById(sectionId);
        if (!result) {
            throw { code: NOT_FOUND, status: OPTION_NOT_FOUND };
        }
        const option = await Option.create({ text: request.text, answer: request.answer, section: result });

        if (request.image) {
            await option.updateOne({ $set: { image: { content: getAsBuffer(request.image.content), content_type: request.image.content_type } } });
        }
        return { code: OK, status: OK_STATUS, additional_information: { result_id: option._id } };
    }
    catch (err) {
        if (err.code)
            throw err;
        else
            throw { code: INTERNAL_SERVER_ERROR, status: err.toString() };
    }
}


export const updateOption = async (optionId: string, request: any): Promise<any> => {
    try {
        if (request.image) {
            request.image.content = getAsBuffer(request.image.content);
        }
        const result = await Option.findById(optionId);
        if (!result) {
            throw { code: NOT_FOUND, status: QUESTION_NOT_FOUND };
        }
        return await result.updateOne({ text: request.text, image: request.image });
    }
    catch (err) {
        if (err.code)
            throw err;
        else
            throw { code: INTERNAL_SERVER_ERROR, status: err.toString() };
    }
}