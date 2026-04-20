UPDATE public.players
SET eligibility_status = 'ineligible',
    eligibility_note = 'Cap-tied — sélectionné en équipe A senior par le Canada, ne peut plus jouer pour la RDC.'
WHERE name = 'Moïse Bombito';