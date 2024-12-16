import React from "react";

const DashboardIcon = ({ isActive }) => {
  return (
    <svg
      //   className={className}
      fill={isActive?"#CD8143":"#755942"}
      width="24"
      height="25"
      viewBox="0 0 24 25"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M3 5.03192V19.0319C3 20.1319 3.89 21.0319 5 21.0319H11V3.03192H5C3.89 3.03192 3 3.93192 3 5.03192ZM19 3.03192H13V11.0319H21V5.03192C21 3.93192 20.1 3.03192 19 3.03192ZM13 21.0319H19C20.1 21.0319 21 20.1319 21 19.0319V13.0319H13V21.0319Z"
        fill={isActive?"#CD8143":"#755942"}
      />
    </svg>
  );
};

export default DashboardIcon;
