import React, { useEffect, useState } from 'react';
import { Typography } from 'antd';
import dayjs from 'dayjs';
import { siteConfig } from '../config/siteConfig';

const { Title } = Typography;

function computeAgeString(): string {
  const birth = dayjs(siteConfig.birthDate);
  const diff = dayjs().diff(birth, 'year', true);
  return diff.toFixed(9);
}

export const LiveAgeBio: React.FC = () => {
  const [age, setAge] = useState<string>(() => computeAgeString());

  useEffect(() => {
    const interval = window.setInterval(() => {
      setAge(computeAgeString());
    }, 50);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="bio-section">
      <Title level={2} className="bio-line">
        I&apos;m a <span className="age-ticker">{age}</span> year-old
      </Title>
      <Title level={2} className="bio-line">
        <span className="role-accent">
          {siteConfig.role}
          <span className="underline static-underline" />
        </span>
        .
      </Title>
    </div>
  );
};
