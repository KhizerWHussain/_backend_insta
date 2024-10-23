interface CreateFullNameType {
  firstName: string;
  lastName: string;
}

export const createFullName = ({ firstName, lastName }: CreateFullNameType) => {
  const LName = lastName ? lastName : '';
  const fullName = firstName + ' ' + LName;
  return fullName.trim();
};
