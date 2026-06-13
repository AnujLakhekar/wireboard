import React from "react";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarBadge,
} from "@/components/ui/avatar";

interface AvatarProps {
  users: {
    presence: {
      name: string;
      color: string;
      img: string | null;
    };
  }[];
}

const AvatarContainer = ({ users }: AvatarProps) => {
  return (
    <div>
      <AvatarGroup>
        {users.map((user, index) => (
          <Avatar key={index}>
            <AvatarImage src={user.presence.img || undefined} alt={user.presence.name} />
            <AvatarFallback>{user.presence.name}</AvatarFallback>
          </Avatar>
        ))}
      </AvatarGroup>
    </div>
  );
};

export default AvatarContainer;
