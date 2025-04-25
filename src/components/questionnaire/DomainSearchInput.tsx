import { useState, useEffect } from "react";
import { Globe, Mail } from "lucide-react";

type DomainSearchInputProps = {
  questionId: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
};

export const DomainSearchInput = ({
  questionId,
  placeholder,
  value,
  onChange,
}: DomainSearchInputProps) => {
  const [domainName, setDomainName] = useState("");

  // Initialize from provided value
  useEffect(() => {
    if (value && !value.startsWith("customDomain:")) {
      setDomainName(value);
    }
  }, [value]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setDomainName(newValue);
    onChange(newValue);
  };

  return (
    <div className="relative">
      <div className="rounded-lg bg-gray-800/50 border border-gray-700 p-5">
        <div className="flex items-center mb-4">
          <div className="p-2 bg-orange-500/20 rounded-full mr-3">
            <Globe className="h-5 w-5 text-[#F58327]" />
          </div>
          <h3 className="text-lg font-medium text-white">Domain Selection</h3>
        </div>

        <div className="mb-5">
          <p className="text-gray-300 mb-3">
            We're currently upgrading our domain search feature to improve
            accuracy and provide better options for your business.
          </p>
          <p className="text-gray-300 mb-3">
            In the meantime, simply tell us what domain name you'd like (without
            the extension like .com or .net), and we'll email you your options.
          </p>
        </div>

        <div className="relative mb-4">
          <input
            type="text"
            value={domainName}
            onChange={handleInputChange}
            placeholder="Enter your preferred domain name (e.g. myawesomebusiness)"
            className="w-full bg-transparent text-white text-xl md:text-2xl py-4 pr-10 border-b-2 border-neutral-800 focus:border-[#F58327] focus:outline-none transition-all duration-200 placeholder-neutral-600"
          />
        </div>

        <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
          <div className="flex items-start">
            <Mail className="h-5 w-5 text-[#F58327] mr-3 mt-1 flex-shrink-0" />
            <div>
              <p className="text-gray-300 text-sm">
                Once you've completed the questionnaire, our team will contact
                you to discuss your domain options and register your preferred
                choice at no additional cost.
              </p>
              <p className="text-gray-300 text-sm mt-2">
                If you have any questions, please contact us at{" "}
                <a
                  href="mailto:support@lumixdigital.com.au"
                  className="text-[#F58327] hover:underline"
                >
                  support@lumixdigital.com.au
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
