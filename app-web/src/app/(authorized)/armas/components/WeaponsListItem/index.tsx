import { IconButton, TableCell, TableRow, Tooltip } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { FiEdit2, FiEye, FiTrash2 } from 'react-icons/fi';
import { useIsGoogleUser } from '@/hooks/Auth';
import { DefaultText } from '@/shared/components/Texts';
import { ImageAvatarPreview } from '@/shared/components/ImageAvatarPreview';
import { TagBadge } from '@/shared/components/TagBadge';
import {
  IDamageType,
  IWeaponListItem,
  WeaponDamageDie,
} from '@/shared/interfaces';
import { APP_COLORS } from '@/shared/constants';
import { formatPriceWithCurrency } from '@/shared/util';

export interface WeaponsListItemProps {
  weapon: IWeaponListItem;
  onView: (weapon: IWeaponListItem) => void;
  onEdit: (weapon: IWeaponListItem) => void;
  onDelete: (weapon: IWeaponListItem) => void;
}

const formatWeaponDamage = (
  damageValue?: number | null,
  damageDie?: WeaponDamageDie | null,
  damageType?: IDamageType | null,
): string => {
  const hasDamageValue = damageValue !== null && damageValue !== undefined;
  const hasDamageDie = damageDie !== null && damageDie !== undefined;
  const dieValue = `${hasDamageValue ? damageValue : ''}${
    hasDamageDie ? damageDie : ''
  }`;

  if (dieValue && damageType) {
    return `${dieValue} ${damageType.name}`;
  }

  if (dieValue) {
    return dieValue;
  }

  if (damageType) {
    return damageType.name;
  }

  return 'Não informado';
};

export const WeaponsListItem = ({
  weapon,
  onView,
  onEdit,
  onDelete,
}: WeaponsListItemProps) => {
  const isGoogleUser = useIsGoogleUser();

  return (
    <TableRow
      sx={{
        transition: 'background-color 0.2s ease',
        '&:hover': { backgroundColor: alpha(APP_COLORS.gold, 0.12) },
      }}
    >
      <TableCell sx={{ borderColor: APP_COLORS.gold }}>
        <ImageAvatarPreview
          imageUrl={weapon.referenceImage}
          alt={weapon.name}
        />
      </TableCell>
      <TableCell sx={{ borderColor: APP_COLORS.gold }}>
        <DefaultText>{weapon.name}</DefaultText>
      </TableCell>
      <TableCell sx={{ borderColor: APP_COLORS.gold }}>
        <div className="flex flex-wrap items-center gap-1">
          {weapon.tags.map((tag) => (
            <TagBadge key={tag.id} name={tag.name} color={tag.color} />
          ))}
        </div>
      </TableCell>
      <TableCell sx={{ borderColor: APP_COLORS.gold }}>
        <DefaultText>
          {formatWeaponDamage(
            weapon.damageValue,
            weapon.damageDie,
            weapon.damageType,
          )}
        </DefaultText>
      </TableCell>
      <TableCell sx={{ borderColor: APP_COLORS.gold }}>
        <DefaultText>
          {formatPriceWithCurrency(weapon.price, weapon.currency)}
        </DefaultText>
      </TableCell>
      <TableCell align="right" sx={{ borderColor: APP_COLORS.gold }}>
        <Tooltip title="Visualizar">
          <IconButton
            aria-label="Visualizar"
            onClick={() => onView(weapon)}
            sx={{ color: APP_COLORS.textBrownDark }}
          >
            <FiEye />
          </IconButton>
        </Tooltip>
        {!isGoogleUser && (
          <>
            <Tooltip title="Editar">
              <IconButton
                aria-label="Editar"
                onClick={() => onEdit(weapon)}
                sx={{ color: APP_COLORS.textBrownDark }}
              >
                <FiEdit2 />
              </IconButton>
            </Tooltip>
            <Tooltip title="Excluir">
              <IconButton
                aria-label="Excluir"
                onClick={() => onDelete(weapon)}
                sx={{ color: APP_COLORS.textBrownDark }}
              >
                <FiTrash2 />
              </IconButton>
            </Tooltip>
          </>
        )}
      </TableCell>
    </TableRow>
  );
};
