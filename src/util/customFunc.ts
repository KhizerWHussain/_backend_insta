interface CreateFullNameType {
  firstName: string;
  lastName: string;
}

export const createFullName = ({ firstName, lastName }: CreateFullNameType) => {
  const LName = lastName ? lastName : '';
  const fullName = firstName + ' ' + LName;
  return fullName.trim();
};

export function getFileExtension(input: any) {
  if (input) {
    const fileName = input.originalname;
    return fileName.split('.').pop();
  }

  if (typeof input === 'string') {
    const extension = input.split('.').pop();
    if (extension === input) {
      return null;
    }
    return extension;
  }

  return null;
}
