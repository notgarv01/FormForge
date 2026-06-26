import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb+srv://garvgupta6778_db_user:fXMcVYqe2NjRskIm@cluster0.dzqrios.mongodb.net/formforge?retryWrites=true&w=majority';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('Successfully connected to MongoDB Atlas.'))
  .catch(err => console.error('MongoDB Atlas connection error:', err));

// Common conversion options to map _id to id when returned to front-end
const schemaOptions = {
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  },
  toObject: {
    virtuals: true,
    transform: (doc, ret) => {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
};

// --- SCHEMAS & MODELS ---

const UserSchema = new mongoose.Schema({
  _id: { type: String, default: () => 'usr_' + Math.random().toString(36).substr(2, 9) },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
}, schemaOptions);

const FormSchema = new mongoose.Schema({
  _id: { type: String, default: () => 'frm_' + Math.random().toString(36).substr(2, 9) },
  userId: { type: String, required: true },
  name: { type: String, required: true },
  customRedirect: { type: String, default: '' },
  notifyEmail: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
}, schemaOptions);

const SubmissionSchema = new mongoose.Schema({
  _id: { type: String, default: () => 'sub_' + Math.random().toString(36).substr(2, 9) },
  formId: { type: String, required: true },
  payload: { type: mongoose.Schema.Types.Mixed, default: {} },
  createdAt: { type: Date, default: Date.now }
}, schemaOptions);

const User = mongoose.model('User', UserSchema);
const Form = mongoose.model('Form', FormSchema);
const Submission = mongoose.model('Submission', SubmissionSchema);

class FormForgeDatabase {
  // --- USER API ---
  async createUser(email, password) {
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      throw new Error('An account with this email already exists.');
    }

    const newUser = new User({
      email: email,
      password: password
    });

    await newUser.save();
    return newUser.toJSON();
  }

  async authenticateUser(email, password) {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || user.password !== password) {
      throw new Error('Invalid email or password.');
    }
    return user.toJSON();
  }

  // --- FORMS API ---
  async createForm(userId, name, customRedirect = '', notifyEmail = '') {
    let finalNotifyEmail = notifyEmail;
    if (!finalNotifyEmail) {
      const user = await User.findById(userId);
      finalNotifyEmail = user ? user.email : '';
    }

    const newForm = new Form({
      userId: userId,
      name: name,
      customRedirect: customRedirect,
      notifyEmail: finalNotifyEmail
    });

    await newForm.save();
    return newForm.toJSON();
  }

  async getForms(userId) {
    const forms = await Form.find({ userId });
    return forms.map(f => f.toJSON());
  }

  async getForm(formId) {
    const form = await Form.findById(formId);
    return form ? form.toJSON() : null;
  }

  async updateForm(userId, formId, customRedirect, notifyEmail) {
    const form = await Form.findOne({ _id: formId, userId: userId });
    if (!form) {
      throw new Error('Form not found or unauthorized.');
    }
    form.customRedirect = customRedirect;
    form.notifyEmail = notifyEmail;
    await form.save();
    return form.toJSON();
  }

  async deleteForm(userId, formId) {
    const result = await Form.deleteOne({ _id: formId, userId: userId });
    if (result.deletedCount > 0) {
      // Also delete related submissions
      await Submission.deleteMany({ formId: formId });
      return true;
    }
    return false;
  }

  // --- SUBMISSIONS API ---
  async addSubmission(formId, payload) {
    const form = await this.getForm(formId);
    if (!form) {
      throw new Error('Form not found.');
    }

    const submission = new Submission({
      formId: formId,
      payload: payload
    });

    await submission.save();
    return submission.toJSON();
  }

  async getSubmissions(formId) {
    const submissions = await Submission.find({ formId }).sort({ createdAt: -1 });
    return submissions.map(s => s.toJSON());
  }
}

export const db = new FormForgeDatabase();
